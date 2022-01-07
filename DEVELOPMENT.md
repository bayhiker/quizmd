# Publishing

In order to build files into a dist folder and publish files built in root folder of
quizmd package, a "private: true" line is added to package.json to prevent publishing
from the main folder. You have to cd into dist folder and run "npm publish"
