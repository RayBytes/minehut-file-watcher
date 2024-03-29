# minehut-file-watcher
[![GitHub](https://img.shields.io/github/license/RayBytes/minehut-file-watcher.svg?style=flat-square)](https://github.com/RayBytes/minehut-file-watcher)

minehut-file-watcher is a helpful command line tool that will watch your files and automatically push them to your Minehut server when they are changed. This is great for people writing config files or scripts, as they don't have to type in their editor, copy-and-paste the content from their editor to Minehut's editor, then click Save, wait for it to upload, then reload in-game. Instead, they can just type in their editor and reload in-game. Nothing more.

Like this project? [Star the repo](https://github.com/RayBytes/minehut-file-watcher/stargazers)  
Found a bug, have a suggestion? [Make an issue](https://github.com/RayBytes/minehut-file-watcher/issues)  

**This is a fixed version of Jellz minehut file watcher (https://github.com/jellz/minehut-file-watcher)**
**I am not the original creator, just maintaining it with new breaking API changes.**

## Getting Started

> Currently the only way to install it is download the code, and install it globally, locally.
> E.g `npm install -g ./directory/here/minehut-file-watcher`

```
$ mh-watch

minehut-file-watcher

--setserver=<server name>
Set the server to push files to (persistent)

--setsession=<session id>
Set the session id to use to authenticate with Minehut (not persistent, you may need to update this)

--setauth=<token>
Set the password to use to authenticate with Minehut (not persistent, you may need to update this)

--setprofiletoken=<id>
Set the SLG profile token to authenticate with Minehut

--dump=<auth>
If you use the code in the read me, you can just dump the result here and everything will be set for you.

--getconfig
Get your current config. Useful for debugging.

--minehutpath=<remote path>
Set the path of the file you want to update remotely

--download=<remote path>
Download a file from the minehut server

After setting the above persistent config values, use mh-watch <file> (--minehutpath=<remote path>).
```

To clarify the --minehutpath option: you must provide it when you run `mh-watch <file>`, not before as a standalone option. For example, `mh-watch --minehutpath=/plugins/Skript/scripts/myscript.sk` and then `mh-watch script.sk` will **not work**. 

You need to do `mh-watch script.sk --minehutpath=/plugins/Skript/scripts/myscript.sk`.

### Setup

So in the initial versions of this tool, it was much easier to setup. However with API changes it has become very hard.
You can use the __MH+ google chrome extension__ to make the following process easier, as it will automatically fetch the keys needed
when you open the minehut.com website.

At the moment, you can use the following code to get the auth keys:
(You need to inspect element the minehut website, and go to console. Paste this all in there)

```javascript
console.save = function (data, filename) {
    if (!data) {
        console.error('Console.save: No data')
        return;
    }

    if (!filename) filename = 'data.json'

    if (typeof data === "object") {
        data = JSON.stringify(data, undefined, 4)
    }

    var blob = new Blob([data], {
            type: 'text/json'
        }),
        e = document.createEvent('MouseEvents'),
        a = document.createElement('a')

    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
}

const getCookie = (name) => decodeURIComponent(document.cookie).split("; ").find(
  cookie => cookie.startsWith(name)
).slice(name.length + 1);

console.save(({
    minehutToken: getCookie("access_token_prd"),
    minehutSession: localStorage.minehut_session_id,
    slgUserToken: localStorage.slg_user_token,
}));
```
Take the values and input them into the seperate inputs for each value.
(Or, you can instead use the --dump=(auth-file) method to just dump the full file result of the code above and have it sorted automatically by the code.)

- Set your Minehut session-id with `mh-watch --setsession=1234abcd`
- Set your Minehut auth token with `mh-watch --setauth=minehutisfree78`
- Set your Minehut SLG profile token with `mh-watch --setprofiletoken=omgthisismyprofile!!`
- Choose your server with `mh-watch --setserver=MyServer` (the command should output the server ID if it was successful)

After setting the three config values, run the following command in a terminal: `mh-watch path/to/my/file.yml --minehutpath=path/to/file/on/minehut.yml`. If I was editing a script, I would use the command `mh-watch shop.sk --minehutpath=plugins/Skript/scripts/shop.sk`. You need to pass the `--minehutpath` option every time you watch a file, while the other three config options are persistent.

> **Note:** If the value of `minehutpath` is a path to a nonexistent file, the file will automatically be created on the server.
