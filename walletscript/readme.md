The Notify Script
=================

This script convienently turns the -walletnotify and -blocknotify option callbacks from most crypto currency clients into a socket stream, enabling receives to be efficiently recognized by other programs.

Install
-------
Change this line with your the proper address for the txt file you want to save to in notify.c
```
FILE *f = fopen("/Users/jacobtorba/coinpair/walletscript/failed-txn.txt", "ab");
```
Compile with gcc (will need to install on mac and windows systems)
```
gcc -o notify notify.c
```
On your favorite crypto currency client that supports notifications, like bitcoind. Modify the client configuration (the bitcoin.conf file in my case) to include a new parameter with it linking to this script, for me:

```
walletnotify=/Users/jacobtorba/notify 127.0.0.1 1337 %s
```
or if you need block notification:

```
blocknotify=/Users/jacobtorba/notify 127.0.0.1 1337 %s
```
That's it! All you need now is a program that can interpret the stream on the specified ip address and port.