/* jshint laxcomma: true */
/* global module,require,console */
'use strict';

module.exports = (function(){

	var bot;
	var redis;
	var _ = require('lodash');
	var moment = require('moment');
	var starttime = Date.now();

	return function init( _bot ){
		bot = _bot;

		bot.log = log;

		bot.ops = {
			setOp: setOp
			,deOp: deOp
			,isOp: isOp
			,getOps: getOps
		};

		initRedis();
		initOps();

		bot.on('error', function(err) {
			log('irc error', err);
		});

		bot.on('message', function( from, to, text){

			bot.log('message', from, to, text);

			if (text.indexOf('#help') === 0) {

				// var keyword = text.replace('#help', '').trim();
				bot.say(from, 'I am zoidbox! Please check my documentation here: https://github.com/atuttle/zoidbox/blob/master/help.md');

				isOp(from, function(err, data){
					if (data !== 0) {
						bot.say(from, 'OP Commands are available here: https://github.com/atuttle/zoidbox/blob/master/opshelp.md');
					}
				});
				bot.say(from, 'I have been running for ' + moment(starttime).fromNow(true));

			}

		});
	};

	function initRedis(){
		if (bot.conf.get('REDISTOGO_URL')) {
			var rtg = require('url').parse( bot.conf.get('REDISTOGO_URL') );
			redis = require('redis').createClient(rtg.port, rtg.hostname);
			redis.auth(rtg.auth.split(':')[1]);
		} else {
			redis = require('redis').createClient(
				bot.conf.get('redis_port')
				, bot.conf.get('redis_host')
				, {}
			);
			if (bot.conf.get('redis_auth_pass')) {
				redis.auth(bot.conf.get('redis_auth_pass'), function(err, data) {
					if (err) {
						bot.log('redisClientAuthError:', err, data);
					}
				});
			}
			bot.redis = redis;
			bot.log('redis initialized');
		}

		redis.on('error', function(err){
			bot.log('redisClientError:', err);
		});
	}

	function initOps () {
		var defaultOps = bot.conf.get('ops') || [];
		if (defaultOps.length) {
			_.each(defaultOps, function(item){
				redis.sadd(bot.conf.get('botName') + '.ops', item.toLowerCase());
			});
		}
	}

	function setOp (nick) {
		redis.sadd(bot.conf.get('botName') + '.ops', nick.toLowerCase());
	}

	function deOp (nick) {
		if (_.contains(bot.conf.get('ops'), nick)){
			return false;
		}
		redis.srem(bot.conf.get('botName') + '.ops', nick.toLowerCase());
		return true;
	}

	function isOp (nick, callback) {
		redis.sismember(bot.conf.get('botName') + '.ops', nick.toLowerCase(), callback);
	}

	function getOps (callback) {
		redis.smembers(bot.conf.get('botName') + '.ops', callback);
	}

	function log() {
		if (bot.conf.get('debug') || false) {
			console.log( Array.prototype.slice.call(arguments) );
		}
	}

})();