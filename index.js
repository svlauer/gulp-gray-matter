'use strict';

var grayMatter = require('gray-matter'),
    PluginError = require('plugin-error'),
    merge = require('merge'),
    objectPath = require('object-path'),
    through = require('through2');

module.exports = gulpGrayMatter;

/**
 * gray-matter gulp plugin
 * @param  {object} options custom options
 * @return {object}         gulp stream handler
 */
function gulpGrayMatter(options) {

  options = setOptions(options);

  return through.obj(transformChunk);

  /**
   * transform a file
   * @param  {object}    chunk file object
   * @param  {string}    enc   file encoding
   * @param  {Function}  done  callback
   * @return {undefined}
   */
  function transformChunk(chunk, enc, done) {
    if (chunk.isNull()) return done(null, chunk);
    if (chunk.isStream()) return this.emit('error', new PluginError('gulp-gray-matter', 'Streaming not supported'));
    try {
      extractMatter(chunk);
    } catch (err) {
      return this.emit('error', err);
    }
    done(null, chunk);
  }

  /**
   * extract matter data from file and optionally remove matter header
   * @param  {object} chunk file object
   * @return {undefined}
   */
  function extractMatter(chunk) {
    var matter = grayMatter(String(chunk.contents), options.grayMatter),
        data = objectPath.get(chunk, options.property);
    data = options.setData(typeof data === 'object' ? data : {}, matter.data);
    objectPath.set(chunk, options.property, data);
    if (options.remove) {
      chunk.contents = Buffer.from(
        options.trim ? String(matter.content).trim() : matter.content
      );
    }
  }

  /**
   * sets new data values
   * @param  {object}    oldData old data
   * @param  {object}    newData new data
   * @return {undefined}
   */
  function setData(oldData, newData) {
    return merge.recursive(oldData, newData);
  }

  /**
   * validate/set custom options
   * @param  {object} opts    custom options
   * @return {object} options object
   */
  function setOptions(opts) {
    opts = typeof opts === 'object' ? opts : {};

    return {
      property: extractOption(opts, 'property', 'data'),
      remove: extractOption(opts, 'remove', true),
      trim: extractOption(opts, 'trim', true),
      setData: extractOption(opts, 'setData', setData),
      grayMatter: opts
    };
  }


  /**
   * Return an option value (or its default value) and remove the corresponding key
   * from the options object
   *
   * @param  {object} opts          custom options
   * @param  {string} name          name of the option to be extracted
   * @param  {mixed}  defaultValue  defaultvalue
   *
   * @return {mixed} value  opts[name] or defaultValue
   */
  function extractOption(opts, name, defaultValue) {
    var value = typeof opts[name] === typeof defaultValue ? opts[name] : defaultValue;
    delete opts[name];
    return value;
  }
}
