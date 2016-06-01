    var _   = require('lodash'),
    url     = require('url'),
    version = require('../../package.json').version;

    function renderJS(files) {
        var out = '';

        _.each(files, function (js) {
            out = out + renderTag({
                'name': 'script',
                'opts': objToKeyval({
                    'type': 'text/javascript',
                    'src': js
                })
            });
        });

        return out;
    }

    function objToKeyval(obj) {
        return _.collect(obj, function (val, key) {
            return {
                'key': key,
                'val': val
            };
        });
    }

    function renderTag(obj) {
        var tag = '';
        tag = '<' + obj.name + ' ';

        _.each(obj.opts, function (opt) {
            if (obj.name === 'script' && opt.key === 'src' && !url.parse(opt.val, false, true).host) {
                opt.val = opt.val + '?v=' + version;
            }

            tag += opt.key + '="' + opt.val + '" ';
        });

        tag += '></' + obj.name + '>';
        return tag;
    }

    module.exports = {
        'renderJS' : renderJS
    };