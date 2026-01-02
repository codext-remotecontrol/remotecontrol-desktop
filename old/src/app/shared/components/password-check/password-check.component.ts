import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnInit,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
} from '@angular/core';

export interface Check {
    hasMinLength?: boolean;
    hasNumber?: boolean;
    hasCapitalCase?: boolean;
    hasSmallCase?: boolean;
    hasSpecialCharacters?: boolean;
}

@Component({
    selector: 'app-password-check',
    styleUrls: ['./password-check.component.scss'],
    templateUrl: './password-check.component.html',
})
export class PasswordCheckComponent implements OnInit {
    _password = '';
    @Input()
    set password(password: string) {
        if (password) {
            this._password = password;
            this.passwordValidation();
        }
    }

    get password() {
        return this._password;
    }

    @Output() checkEv = new EventEmitter<Check>();

    public correct = false;
    check: Check = {};

    checks: any[] = [
        {
            name: 'hasMinLength',
            message: 'Must contain at least 8 characters',
        },
        {
            name: 'hasNumber',
            message: 'Must contain at least one number',
        },
        {
            name: 'hasCapitalCase',
            message: 'Must contain at least one capital letter',
        },
        {
            name: 'hasSmallCase',
            message: 'Must contain at least one lower case letter',
        },
        {
            name: 'hasSpecialCharacters',
            message: 'Must contain at least one special character',
        },
    ];

    constructor(
        private cdRef: ChangeDetectorRef,
        private translate: TranslateService
    ) {}

    ngOnInit() {
        this.loadTranslation();
        this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
            this.loadTranslation();
        });
    }

    async loadTranslation() {
        this.checks.forEach(async check => {
            if (check.message) {
                this.translate.get(check.message).subscribe(title => {
                    check.message = title;
                });
            }
        });
    }

    passwordValidation() {
        const password = this._password;
        let allCorrect = true;
        const checks: {
            hasMinLength?: boolean;
            hasNumber?: boolean;
            hasCapitalCase?: boolean;
            hasSmallCase?: boolean;
            hasSpecialCharacters?: boolean;
        } = {};

        if (password.match(/.{8,}/)) {
            checks.hasMinLength = true;
        } else {
            checks.hasMinLength = false;
        }

        if (password.match(/[0-9]/)) {
            checks.hasNumber = true;
        } else {
            checks.hasNumber = false;
        }

        if (password.match(/[A-Z]/)) {
            checks.hasCapitalCase = true;
        } else {
            checks.hasCapitalCase = false;
        }

        if (password.match(/[a-z]/)) {
            checks.hasSmallCase = true;
        } else {
            checks.hasSmallCase = false;
        }

        if (password.match(/[!@#$%^&*)(+=._-]+/)) {
            checks.hasSpecialCharacters = true;
        } else {
            checks.hasSpecialCharacters = false;
        }

        Object.keys(checks).forEach(key => {
            if (!checks[key]) {
                allCorrect = false;
            }
        });

        Object.assign(this.check, checks);

        setTimeout(() => {
            this.correct = allCorrect;
        });

        // this.checkEv.emit(this.check);
        // this.cdRef.detectChanges();
    }
}
