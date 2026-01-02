/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import {
    fadeInDownOnEnterAnimation,
    fadeOutUpOnLeaveAnimation,
} from 'angular-animations';
import { AnimationOptions } from 'ngx-lottie';
import SimplePeer from 'simple-peer';
import SimplePeerFiles from 'simple-peer-files';
import 'webrtc-adapter';
import { SocketService } from '../../app/core/services/socket.service';
import { AppService } from './../../app/core/services/app.service';
import { ElectronService } from '../../app/core/services/electron.service';

@Component({
    template: `
        <ion-header>
            <ion-toolbar color="primary">
                <ion-title>{{ 'Enter Password' | translate }}</ion-title>
            </ion-toolbar>
        </ion-header>
        <ion-content>
            <div class="p-5">
                <ion-input
                    [label]="'Password' | translate"
                    [(ngModel)]="pw"
                    label-placement="floating"
                    fill="solid"
                    placeholder="Enter text"></ion-input>
            </div>
        </ion-content>
        <ion-footer>
            <ion-toolbar>
                <ion-button (click)="cancel()">
                    {{ 'Cancel' | translate }}
                </ion-button>
                <ion-button
                    cdkFocusInitial
                    (click)="connect()">
                    {{ 'Connect' | translate }}
                </ion-button>
            </ion-toolbar>
        </ion-footer>
    `,
})
export class PwDialog {
    @Input() pw = '';

    @HostListener('document:keydown.enter', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.connect();
    }

    constructor(private modalCtrl: ModalController) {}

    connect() {
        return this.modalCtrl.dismiss(this.pw);
    }

    cancel() {
        return this.modalCtrl.dismiss(null);
    }
}

@Component({
    selector: 'app-remote',
    templateUrl: './remote.page.html',
    styleUrls: ['./remote.page.scss'],
    animations: [
        fadeInDownOnEnterAnimation({ duration: 150 }),
        fadeOutUpOnLeaveAnimation({ duration: 150 }),
    ],
})
export class RemotePage implements OnInit, OnDestroy {
    signalData = '';
    peer2: SimplePeer.Instance;
    spf: SimplePeerFiles;
    userId = 'browser';
    video: HTMLVideoElement;
    stream: any;
    videoSize;
    hostScreenSize;

    showOptions = false;
    connected = false;
    fileDrop = false;
    fileLoading = false;
    cursor = true;
    transfer;
    files: any = [];

    fileProgress = 0;

    options: AnimationOptions | any = {
        path: '/assets/animations/lf30_editor_PsHnfk.json',
        loop: true,
    };

    @HostListener('document:dragover', ['$event'])
    onDragOver(event) {
        console.log('event', event);
        event.preventDefault();
        event.stopPropagation();
        this.fileDrop = true;
    }

    @HostListener('document:dragleave', ['$event'])
    onDragLeave(event) {
        console.log('event', event);
        event.preventDefault();
        event.stopPropagation();
        this.fileDrop = false;
    }

    @HostListener('drop', ['$event'])
    ondrop(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this.fileDrop = false;
        const f = evt.dataTransfer.files;
        if (f.length > 0) {
            console.log(f);
            for (let i = 0; i < f.length; i++) {
                const file = f[i];
                const fileID = file.name + file.size;
                this.files[fileID] = file;
                this.peer2.send('file-' + fileID);
            }
        }
    }

    @HostListener('contextmenu', ['$event'])
    oncontextmenu(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (this.connected) {
            console.log('event', event);
            event.preventDefault();
            event.stopPropagation();
            this.keydownListener(event);
        }
    }

    @HostListener('mousewheel', ['$event'])
    onScroll(event: WheelEvent) {
        if (this.connected) {
            event.preventDefault();
            event.stopPropagation();
            this.scrollListener(event);
        }
    }

    @HostListener('window:resize', ['$event'])
    onResize() {
        this.calcVideoSize();
    }

    @HostListener('document:paste', ['$event'])
    onPaste(event: ClipboardEvent) {
        const text: string | undefined = event?.clipboardData?.getData('text');
        this.peer2.send('clipboard-' + text);
    }

    constructor(
        private socketService: SocketService,
        private elementRef: ElementRef,
        private appService: AppService,
        private route: ActivatedRoute,
        public electronService: ElectronService,
        private modalCtrl: ModalController,
        private cdr: ChangeDetectorRef,
        private alertCtrl: AlertController
    ) {}

    fileChangeEvent(event) {
        const e = event.files;
        const file = e[0];
        const fileID = file.name + file.size;
        this.files[fileID] = file;
        this.peer2.send('file-' + fileID);
    }

    pwPrompt() {
        return new Promise<string>(async resolve => {
            const modal = await this.modalCtrl.create({
                component: PwDialog,
            });
            modal.present();

            const { data, role } = await modal.onWillDismiss();
            resolve(data);
        });
    }

    async ngOnInit() {
        if (this.electronService.isElectron) {
            const clipboard = this.electronService.clipboard;
            clipboard
                .on('text-changed', () => {
                    const currentText = clipboard.readText();
                    console.log('currentText', currentText);
                    this.peer2.send('clipboard-' + currentText);
                })

                .on('image-changed', () => {
                    const currentIMage = clipboard.readImage();
                    console.log('currentText', currentIMage);
                })
                .startWatching();
        }

        let id = this.route.snapshot.queryParams.id;
        if (!id) {
            const alert = await this.alertCtrl.create({
                backdropDismiss: false,
                header: 'Partner ID',
                message: 'Geben Sie die ID Ihres Partners ein.',
                inputs: [
                    {
                        name: 'id',
                        type: 'number',
                        placeholder: '555555555',
                    },
                ],
                buttons: [
                    {
                        text: 'Verbinden',
                        handler: event => {
                            console.log('event', event);
                            id = event.id;
                            this.init(id);
                        },
                    },
                ],
            });

            await alert.present();
        } else {
            this.init(id);
        }
    }

    init(id) {
        this.appService.sideMenu = false;
        if (this.electronService.isElectron) {
            this.spf = new SimplePeerFiles();
        }

        console.log('id', id);
        this.socketService.init();
        this.socketService.joinRoom(id);
        setTimeout(() => {
            this.socketService.sendMessage('hi');
        }, 100);

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.socketService.onNewMessage().subscribe(async (data: any) => {
            console.log('onNewMessage', data);

            if (typeof data == 'string' && data?.startsWith('screenSize')) {
                const size = data.split(',');
                this.hostScreenSize = {
                    height: +size[2],
                    width: +size[1],
                };
            } else if (
                typeof data == 'string' &&
                data?.startsWith('pwRequest')
            ) {
                this.askForPw();
            } else if (typeof data == 'string' && data?.startsWith('decline')) {
                this.close();
                this.cdr.detectChanges();
            } else if (typeof data == 'string' && data?.startsWith('pwWrong')) {
                const alert = await this.alertCtrl.create({
                    header: 'Passwort nicht korrekt',
                });
                await alert.present();

                this.askForPw();
                // this.close();
                this.cdr.detectChanges();
            } else {
                this.peer2.signal(data);
            }
        });

        this.initPeer(id);
    }

    async askForPw() {
        const pw: string = await this.pwPrompt();
        if (pw) {
            this.socketService.sendMessage(`pwAnswer:${pw}`);
        } else {
            this.socketService.sendMessage('decline');
            this.close();
        }
        this.cdr.detectChanges();
    }

    initPeer(id) {
        this.peer2 = new SimplePeer({
            // channelName: id,
            config: {
                iceServers: [
                    {
                        urls: [
                            'stun:turn.codext.de',
                            'stun:stun.nextcloud.com:443',
                        ],
                    },
                    {
                        username: 'Z1VCyC6DDDrwtgeipeplGmJ0',
                        credential:
                            '8a630ce342e1ec3fb2b8dbc8eaa395f837038ddcc5',
                        urls: [
                            'turn:turn.codext.de:80?transport=udp',
                            'turn:turn.codext.de:80?transport=tcp',
                            'turns:turn.codext.de:443?transport=tcp',
                        ],
                    },
                ],
            },
        });

        this.peer2.on('signal', data => {
            this.socketService.sendMessage(data);
        });
        this.peer2.on('stream', stream => {
            this.connected = true;

            const videoBg: HTMLVideoElement =
                this.elementRef.nativeElement.querySelector('#videobg');

            videoBg.srcObject = stream;
            videoBg.play();

            const video: HTMLVideoElement =
                this.elementRef.nativeElement.querySelector('#video');
            this.video = video;
            this.stream = stream;
            video.srcObject = stream;
            video.play();

            video.addEventListener('mousedown', this.mouseListener.bind(this));
            video.addEventListener('mouseup', this.mouseListener.bind(this));
            video.addEventListener('dblclick', this.mouseListener.bind(this));
            video.addEventListener(
                'mousemove',
                this.mouseMoveListener.bind(this)
            );
            video.addEventListener(
                'resize',
                () => {
                    const w = video.videoWidth;
                    const h = video.videoHeight;

                    if (w && h) {
                        video.style.width = w.toString();
                        video.style.height = h.toString();
                    }
                    console.log(w, h);
                },
                false
            );

            video.addEventListener(
                'loadeddata',
                () => {
                    this.calcVideoSize();
                },
                false
            );
        });
        this.peer2.on('close', () => {
            console.log('close');
            this.close();
        });
        this.peer2.on('error', () => {
            console.log('error');
            this.close();
        });
        this.peer2.on('data', async data => {
            if (data) {
                const fileTransfer = data.toString();
                if (fileTransfer.substr(0, 5) === 'file-') {
                    const fileID = fileTransfer.substr(5);
                    this.spf
                        .receive(this.peer2, fileID)
                        .then((transfer: any) => {
                            transfer.on('progress', p => {
                                console.log('progress', p);
                            });
                            transfer.on('done', done => {
                                console.log('done', done);
                            });
                        });
                    this.peer2.send(`start-${fileID}`);
                    return;
                } else if (fileTransfer.substr(0, 6) === 'start-') {
                    this.fileLoading = true;
                    this.cdr.detectChanges();
                    const fileID = fileTransfer.substr(6);
                    this.transfer = await this.spf.send(
                        this.peer2,
                        fileID,
                        this.files[fileID]
                    );
                    this.transfer.on('progress', p => {
                        console.log('progress', p);
                        this.fileProgress = p;
                    });
                    this.transfer.on('done', done => {
                        console.log('done', done);
                        this.fileLoading = false;
                        this.cdr.detectChanges();
                    });
                    this.transfer.on('cancel', done => {
                        console.log('cancel', done);
                        this.fileLoading = false;
                        this.cdr.detectChanges();
                    });
                    this.transfer.on('cancelled', done => {
                        console.log('cancelled', done);
                        this.fileLoading = false;
                        this.cdr.detectChanges();
                    });
                    try {
                        this.transfer.start();
                    } catch (error) {}
                    return;
                }
            }
        });
    }

    close() {
        this.connected = false;
        this.removeEventListeners();
        this.electronService.window.close();
    }

    calcVideoSize() {
        this.videoSize = this.video?.getBoundingClientRect();
        // const height = this.stream?.getVideoTracks()[0].getSettings().height;
        // const width = this.stream?.getVideoTracks()[0].getSettings().width;

        /*this.hostScreenSize = {
      height: 1080,
      width: 1920,
    };*/
        console.log('this.hostScreenSize', this.hostScreenSize, this.videoSize);
    }

    ngOnDestroy() {
        this.appService.sideMenu = true;
        this.removeEventListeners();
        this.socketService?.destroy();
        this.peer2?.destroy();
    }

    getFileProgress(fileProgress) {
        return fileProgress ? fileProgress.toFixed() : '';
    }

    removeEventListeners() {
        // this.video?.removeEventListener('auxclick', this.mouseListener.bind(this));
        this.video?.removeEventListener(
            'mousedown',
            this.mouseListener.bind(this)
        );
        this.video?.removeEventListener(
            'mouseup',
            this.mouseListener.bind(this)
        );
        this.video?.removeEventListener(
            'dblclick',
            this.mouseListener.bind(this)
        );
        this.video?.removeEventListener(
            'mousemove',
            this.mouseMoveListener.bind(this)
        );
    }

    mouseListener(event: MouseEvent) {
        console.log('event', event);
        if (!this.connected) {
            return;
        }
        let type: string;
        if (event.type == 'mouseup') {
            type = 'mu';
        } else if (event.type == 'mousedown') {
            type = 'md';
        } else if (event.type == 'dblclick') {
            type = 'dc';
        }
        const x = this.scale(
            event.offsetX,
            0,
            this.videoSize?.width,
            0,
            this.hostScreenSize?.width
        );

        const y = this.scale(
            event.offsetY,
            0,
            this.videoSize?.height,
            0,
            this.hostScreenSize?.height
        );

        console.log(
            event.offsetX,
            this.videoSize?.height,
            this.hostScreenSize?.height,
            x
        );

        const stringData = `${type},${x},${y},${event.button}`;
        this.peer2?.send(stringData);
    }

    mouseMoveListener(event) {
        if (!this.connected) {
            return;
        }
        const x = this.scale(
            event?.offsetX,
            0,
            this.videoSize?.width,
            0,
            this.hostScreenSize?.width
        );
        const y = this.scale(
            event?.offsetY,
            0,
            this.videoSize?.height,
            0,
            this.hostScreenSize?.height
        );

        const stringData = `mm,${x},${y}`;
        this.peer2?.send(stringData);
    }
    keydownListener(event: KeyboardEvent) {
        if (!this.connected) {
            return;
        }
        const data = {
            t: 'k',
            code: event.code,
            keyCode: event.keyCode,
            key: event.key,
            shift: event.shiftKey,
            control: event.ctrlKey,
            alt: event.altKey,
            meta: event.metaKey,
        };
        this.peer2?.send(JSON.stringify(data));
    }

    scrollListener(event: WheelEvent) {
        if (!this.connected) {
            return;
        }
        let stringData;
        if (event.deltaY < 0) {
            stringData = `s,up`;
        } else if (event.deltaY > 0) {
            stringData = `s,down`;
        }
        this.peer2?.send(stringData);
    }

    scale(x, fromLow, fromHigh, toLow, toHigh) {
        return Math.trunc(
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ((x - fromLow) * (toHigh - toLow)) / (fromHigh - fromLow) + toLow
        );
    }
}
