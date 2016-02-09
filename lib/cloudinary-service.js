var handler = require('./cloudinary-handler');
var cloudinary = require('cloudinary');
var promisify = require('loopback-promisify');
var crypto = require('crypto');
var qs = require('qs');

module.exports = CloudinaryService;


function CloudinaryService(options) {
  if (!(this instanceof CloudinaryService)) {
    return new CloudinaryService(options);
  }
  this.options = options;
  if(options.url !== undefined) {
    process.env.CLOUDINARY_URL = options.url;
  }
  else {
    cloudinary.config({
      cloud_name: options.cloudName,
      api_key: options.apiKey,
      api_secret: options.apiSecret
    });
  }
}

CloudinaryService.prototype.url = function() {
  if(this.options.url) {
    return this.options.url;
  }
  else {
    return ['cloudinary://', this.options.apiKey, this.options.apiSecret, '@', this.options.name].join('');
  }
};

CloudinaryService.prototype.cloudName = function() {
  if(this.options.url) {
    return this.options.url.split('@')[1];
  }
  else {
    return this.options.cloudName;
  }
};

CloudinaryService.prototype.apiKey = function() {
  if(this.options.apiKey) {
    return this.options.apiKey;
  }
  else {
    var url = this.options.url;
    return url.split('//')[1].split('@')[0].split(':')[0];
  }
};

CloudinaryService.prototype.apiSecret = function() {
  if(this.options.apiSecret) {
    return this.options.apiSecret;
  }
  else {
    var url = this.options.url;
    return url.split('//')[1].split('@')[0].split(':')[1];
  }
};

/**
 *
 * @param req
 * @param res
 * @param options
 * @param next
 */
function upload(req, res, options, next) {
  handler.upload(cloudinary, req, res, options, next);
}

CloudinaryService.prototype.upload = promisify.fn(upload);

/**
 *
 * @param url
 * @param options
 * @param next
 */
function uploadFromUrl(url, options, next) {
  console.log('aaa');
  cloudinary.uploader.upload(url, function(result) {
    next(null, result);
  }, options);
}

CloudinaryService.prototype.uploadFromUrl = promisify.fn(uploadFromUrl);

/**
 *
 * @param {String} container currently ignored
 * @param {String} file public image key
 * @param {Function} next
 */
function removeFile(container, file, next) {
  return handler.removeFile(cloudinary, container, file, next);
};

CloudinaryService.prototype.removeFile = promisify.fn(removeFile);

/**
 *
 * @param parameters
 * @param next
 */
function sign(parameters, next) {
  var parametersKeys, paramsSorted, signature;

  parameters = parameters || {};
  parameters.timestamp = Math.round((new Date()).getTime() / 1000);

  parametersKeys = Object.keys(parameters);
  parametersKeys.sort();

  paramsSorted = {};
  parametersKeys.forEach(function(key) {
    paramsSorted[key] = parameters[key];
  });

  paramsSorted = [qs.stringify(paramsSorted), this.apiSecret()].join('');

  signature = crypto.createHash('sha1').update(paramsSorted).digest('hex');

  next(null, {
    api_key: this.apiKey(),
    signature: signature,
    timestamp: parameters.timestamp,
    url: 'https://api.cloudinary.com/v1_1/' + this.cloudName() + '/image/upload'
  });
}

CloudinaryService.prototype.sign = sign;

