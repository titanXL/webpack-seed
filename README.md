# webpack-seed

To include new css/scss files go to scr/css/main.scss and import it
To include new js files go to src/js/app.js and import it

Main HTML files is in src/index.html

To include a new partial html use the following template:
<div>${require('./partial.html')}</div>

To run develepoment mode:
in the terminal type: npm run start

To run production mode:
in the terminal type: npm run build
Files will be bundled and copied in the dist folder
