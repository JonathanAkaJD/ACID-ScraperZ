/*
{
	"id": "Orion",
	"name": "Orion",
	"version": 1705045855,
	"classPath": "Orionoid.Orion",
	"permaUrl": "https://syncler.orionoid.com/F5ENLGAFNJDKAE38NQRF8HCMGNH7CUHC"
}
*/

(function(global, factory)
{
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.Orionoid = {})));
} (this, (function(exports) { 'use strict';

	class Orion
	{
		constructor()
		{
			this.sourceProviders = [new OrionProvider()];
		}

		createBundle(env, request)
		{
			return new Promise((resolve, reject) =>
			{
				var bundle =
				{
					sources : [],
					sourceProviderMetadatas: this.sourceProviders.map(i => i.metadata)
				};
				resolve(bundle);
			});
		}

		createSourceProvider(env, metadata)
		{
			return this.sourceProviders.filter(i => i.metadata.name == metadata.name)[0];
		}
	}

	class OrionProvider
	{
		constructor()
		{
			this.metadata =
			{
				name : 'Orion',
				premium : false,
				containsTorrents : true,
				requiresDebrid : false
			};
		}

		search(env, request)
		{
			try
			{
				function scrape(request)
				{
					var item = null;
					var type = null;
					var imdb = null;
					var tmdb = null;
					var tvdb = null;
					var trakt = null;
					var query = null;
					var title = null;
					var year = null;
					var season = null;
					var episode = null;

					if(request.hasOwnProperty('movie') && request.movie)
					{
						type = 'movie';
						item = request.movie;
					}
					else if(request.hasOwnProperty('episode') && request.episode)
					{
						type = 'show';
						item = request.episode.show;
					}

					if(item.hasOwnProperty('ids') && item.ids)
					{
						if(item.ids.hasOwnProperty('imdb') && item.ids.imdb) imdb = item.ids.imdb;
						if(item.ids.hasOwnProperty('tmdb') && item.ids.tmdb) tmdb = item.ids.tmdb;
						if(item.ids.hasOwnProperty('tvdb') && item.ids.tvdb) tvdb = item.ids.tvdb;
						if(item.ids.hasOwnProperty('trakt') && item.ids.trakt) trakt = item.ids.trakt;
					}

					if(item.hasOwnProperty('titles') && item.titles)
					{
						if(!title && item.titles.hasOwnProperty('main') && item.titles.main)
						{
							if(item.titles.main.hasOwnProperty('title') && item.titles.main.title)
							{
								title = item.titles.main.title;
							}
						}
						if(!title && item.titles.hasOwnProperty('original') && item.titles.original)
						{
							if(item.titles.original.hasOwnProperty('title') && item.titles.original.title)
							{
								title = item.titles.original.title;
							}
						}
						if(!title && item.titles.hasOwnProperty('alternate') && item.titles.alternate)
						{
							if(item.titles.alternate[0].hasOwnProperty('title') && item.titles.alternate[0].title)
							{
								title = item.titles.alternate[0].title;
							}
						}
					}

					if(type == 'movie')
					{
						if(!year && item.hasOwnProperty('year') && item.year)
						{
							year = item.year;
						}
						if(!year)
						{
							var timestamp = null;
							if(item.hasOwnProperty('release') && item.release)
							{
								timestamp = item.release;
							}
							else if(item.hasOwnProperty('collection') && item.collection && item.collection.hasOwnProperty('release') && item.collection.release)
							{
								timestamp = item.collection.release;
							}
							if(timestamp)
							{
								year = new Date(timestamp * 1000).getFullYear();
							}
						}
					}
					else if(type == 'show')
					{
						if(request.episode.hasOwnProperty('seasonNumber') && request.episode.seasonNumber)
						{
							season = request.episode.seasonNumber;
						}
						if(request.episode.hasOwnProperty('episodeNumber') && request.episode.episodeNumber)
						{
							episode = request.episode.episodeNumber;
						}
					}

					if(title)
					{
						query = title;
						if(type == 'movie' && year) query += ' ' + year;
					}

					var data =
					{
						token : 'Q6WNLJMDPADHXLODYECC5UANPV5YMSOR5PT7Q7UIYSDCVJN2ASM7AEWFCFBRIPXYTD7RFSQ5CZVXEKHSJKM3H4BEC3GHQJNYRII3XMC76T7WK2CK3GRQBJ3TQB4LF7FG',

						mode : 'stream',
						action : 'retrieve',

						type : type,
						limitcount : 1,
						sortvalue : 'videoquality',
						sortorder : 'descending',

						streamtype : 'torrent,hoster',
						protocoltorrent : 'magnet',

						filename : true,
						fileunknown : false,

						videoquality : 'hd1080_hd4k',
						audiochannels : '2_',

						access : false,
						lookup : true,
					};

					if(imdb) data['idimdb'] = imdb;
					if(tmdb) data['idtmdb'] = tmdb;
					if(tvdb) data['idtvdb'] = tvdb;
					if(trakt) data['idtrakt'] = trakt;
					if(query) data['query'] = query;
					if(season !== null) data['numberseason'] = season;
					if(episode !== null) data['numberepisode'] = episode;

					data = Object.keys(data).map(function(key)
					{
					  return key + '=' + data[key];
					}).join('&');
					if('&video3d=false') data += '&video3d=false';
					if('') data += '';

					var axios = env.httpClientFactory.createNewInstance();
					return axios.request({
						method : 'post',
						url : 'https://api.orionoid.com',
						data : data,
					}).then(response => {
						return response.data.data.streams;
					});
				}

				return new Promise((resolve, reject) =>
				{
					scrape(request).then(streams =>
					{
						var results = [];

						if(streams)
						{
							streams.forEach(function(stream, index)
							{
								var quality = stream.video.quality;
								if(quality.indexOf('cam') >= 0) quality = 'cam';
								else if(quality.indexOf('scr') >= 0) quality = 'scr';
								else if(quality.indexOf('sd') >= 0) quality = 'sd';
								else if(quality.indexOf('hd') >= 0)
								{
									quality = quality.replace('hd', '');
									if(quality.indexOf('1080') >= 0 || quality.indexOf('720') >= 0) quality += 'p';
								}

								results.push({
									url : stream.links[0],
									name : stream.file.name,
									sizeInBytes : stream.file.size,
									quality : quality,
									resolved : stream.access.direct,
									host : stream.stream.hoster,
									seeders : stream.stream.seeds,
								});
							});
						}

						resolve(results);
					});
				});
			}
			catch(error)
			{
				console.error(error.stack);
			}
		}
	}

	exports.Orion = Orion;
	Object.defineProperty(exports, '__esModule', {value: true});
})));
