<p align="center">
 <img width="100" height="100" src="https://user-images.githubusercontent.com/19570043/232027517-d3cb4aa2-3642-4ab3-810d-0e85961186ee.png">
</p>




[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors)
[![MIT](https://img.shields.io/packagist/l/doctrine/orm.svg?style=flat-square)]()
[![commitizen](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)]()
[![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)]()
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

> WebRTC based remote control for your computer open source


# Remotecontrol – Desktop

Remote Control Desktop is a powerful, reliable and fast open source remote desktop software that supports multiple platforms including Windows, MacOS, and Linux. The main aim of this project is to provide an efficient and hassle-free way of handling remote desktop operations. It's designed with user-friendly features that make it a perfect choice for both technical and non-technical users. Whether you are an IT professional providing remote assistance to your customers, or a user who needs to access their desktop remotely, this tool is perfect for you.

Best of all, Remote Control Desktop prioritizes your privacy. Use your own server for secure connections, or leverage our free server without worrying about data collection. We're dedicated to ensuring your data remains confidential and secure.

## + Points
- ✅ Cross-platform support: Windows, MacOS, Linux
- ✅ User-friendly interface
- ✅ Efficient and fast remote desktop operations
- ✅ Use your own server or our free server
- ✅ Free remote maintenance without data collection
- ✅ Works out of the box - no configuration required

## Features
- ✅ WebRTC based
- ✅ Portable
- ✅ Automatic updates
- ✅ High security
- ✅ Windows, Mac and Linux
- ✅ Open Source
- ✅ No installation required
- ✅ No configuration required
- ✅ No registration required
- ✅ No data collection
- ✅ No ads
- ✅ No tracking
- ✅ remote maintenance
- ✅ address directory
- ✅ file transfer
- ✅ private and commercial
- ✅ Unattended Access
- ✅ Clipboard synchronization
- ✅ Multilingual (English / German)

## Download
- [Download for Windows](https://github.com/codext-remotecontrol/remotecontrol-desktop/releases/latest)
- [Download for MacOS](https://github.com/codext-remotecontrol/remotecontrol-desktop/releases/latest)
- [Download for Linux](https://github.com/codext-remotecontrol/remotecontrol-desktop/releases/latest)


## Demo

<div>
 <img width="200"  src="https://user-images.githubusercontent.com/19570043/198855929-00e2a49e-456b-426c-a63a-e8d4d04fca04.png">
  <img width="200"  src="https://user-images.githubusercontent.com/19570043/198855935-11a5e9be-e937-4557-a57a-3e1fd7e8365f.png">
  <img height="275"  src="https://user-images.githubusercontent.com/19570043/198856069-7e69b81d-4444-4509-939f-92e971b6365a.png">
</div>

## Build your own
```
git clone
npm install
npm run start
```
## selfhost your own server
You can use [coturn](https://github.com/coturn/coturn) to set up your own server. Right now, there is no user accessible way to change the server config, once you have set up your server, you need to rebuild the clients. We are currently working on a client-side GUI option to change the backend servers. That should make the whole thing much better.

## Current Known issues
- Keyboard is not being transmitted 100% of the time, it has bugs.
- Sound is not being transmitted.
- Currently we only support one way file transmisstion, from local to remote.
- Clipboard also is supported one way, from local to remote.


