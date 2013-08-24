WalletServ
==========
The web server that links the request server to the wallet for simple stuff like get address, handles receives as well.

Install
-------
Install node.js (and npm if not already included with whatever node.js package you go for) and foreman. Run this command to easily install all dependencies (from the directory of this)

```
npm install
```
You will need to to have a proper pg database setup for the script, after setting the connection details within the script, run this to format the database properly
```
node db_setup.js
```
It should either tell you that the database has been created or that it went fine.

and to start up the script, in the directory, run this:

```
foreman start
```