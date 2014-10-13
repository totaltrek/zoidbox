'use strict';

module.exports = ( function () {
	var _bot;
	var DDG = require( 'node-ddg-api' ).DDG;
	var ddg = new DDG( 'zoidbox' );

	return function init ( bot ){
		_bot = bot;
		bot.on( 'message#', function ( from, to, text ) {

			if ( text.indexOf( '?' ) === 0 && text.length > 1 ) {
				var q = text.substr( 1 ).trim();
				var opts = {
					skip_disambig: '0',
					no_html: '1'
				};
				ddg.instantAnswer( q, opts, function ( err, response ) {
					var type = response.AnswerType,
						first, answer;
					if ( response.Results && response.Results.length > 0 ) {
						first = response.Results[ 0 ];
					} else if ( response.RelatedTopics && response.RelatedTopics.length > 0 ) {
						first = response.RelatedTopics[ 0 ];
					}
					if ( first && first.hasOwnProperty( 'Text' ) && first.hasOwnProperty( 'FirstURL' ) ) {
						answer = {
							text: first.Text,
							url: first.FirstURL
						};
					}
					if ( err ) {
						bot.say( to, "Something went wrong in your query. Sorry." );
						bot.log( err );
					}
					if ( type === "conversions" ) {
						bot.say( to, response.Answer );
					} else if ( type === "" && answer ) {
						bot.say( to, 'First result for ' + q + ': ' + first.Text + ' ( ' + first.FirstURL + ' )' );
					} else if ( type === "" ) {
						bot.say( to, 'Congratulations, you\'ve stumped DuckDuckGo.' );
					} else {
						bot.log( "i don't know what to do with this response from duckduckgo" );
						bot.log( response );
					}
				} );
			}
		});
	};
})();


