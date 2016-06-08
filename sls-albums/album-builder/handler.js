'use strict';

const async = require('asyncawait/async');
const await = require('asyncawait/await');
const helpers = require('../lib');
const mime = require('mime');
const fs = require('fs');

module.exports.handler = async(function(event, context, cb) {

  const storageBucket = 'demo-codestock-serverless-storage';
  const siteBucket = 'demo-codestock-serverless-site';

  event.albumName = event.albumName.replace(/\ /g, '_');

  // Get the files by looking up the albumName directory in S3
  const objects = await(helpers.s3ListObjects(storageBucket, event.albumName));
  const isImage = (x) => mime.lookup(x.Key.split('.').pop()).indexOf('image') > -1;

  // Filter out images and then standard and thumbnail sized
  const images = objects.Contents.filter(isImage);
  const standard = images.filter(x => x.Key.indexOf('thumb') < 0);
  const thumbs = images.filter(x => x.Key.indexOf('thumb') > -1);

  // Generate an html string using the filenames.
  let htmlString = '<html>';
  thumbs.forEach(t => htmlString += `<p>${t.Key}</p>`);
  htmlString += '</html>';

  // Write the html to a file.
  fs.writeFileSync(`/tmp/${event.albumName}`, htmlString, 'utf8');
  const fileContents = fs.readFileSync(`/tmp/${event.albumName}`).toString('base64');

  // Write the file to S3, using albumName as the directory.
  helpers.s3SaveFile(siteBucket, `albums/${event.albumName}/index.html`, fileContents);

  context.succeed({
    message: images.length
  });

});