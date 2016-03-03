<h1>Minder - V3</h1>
<i>Written by: <a href="">Connor Edwards</a></i>
<hr />

<h4>Installing (Linux)</h4>
<p>Do the following to install the system and its dependencies</p>
```bash
sudo apt-get update
sudo apt-get install nodejs node-legacy npm
sudo npm install nodemon --global
sudo git clone https://github.com/FroopleXP/minder-api-v3
cd minder-api-v3
sudo npm install
```

<hr />

<h4>Starting the Server (Linux)</h4>
<p>To get the Server running you must configure your own `mysql_conn.js`, here's how to do it</p>

```bash
sudo cp mysql_conn.temp.js mysql_conn.js
sudo nano mysql_conn.js
```

<p>From here, you point to Settings to point to your own Minder database. Failure to do this step could result in the error:</p>
```bash
Could not find MySQL connection script - please create one`
```

<p>You can then proceed to start the Server:</p>
```bash
sudo nodemon app.js
```




