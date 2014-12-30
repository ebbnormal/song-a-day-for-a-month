(function() {
   'use strict';

   /* Services */

   angular.module('myApp.services', [])

      // put your services here!
      // .service('serviceName', ['dependency', function(dependency) {}]);

    .factory('messageList', ['fbutil', function(fbutil) {
      return fbutil.syncArray('messages', {limit: 10000, endAt: null});
    }])
    .factory('songs', ['fbutil','$firebase', function(fbutil,$firebase) {
      var service={}
      service.load=0;
      service.list=[];
      service.batch=10;
      fbutil.ref('songs').limitToLast(1).on('child_added', function(snapshot) {
        if (service.list.length==0){
          return;
        }
        var newSong=snapshot.val()
        var exists=false;
        service.list.forEach(function(song,index){
          if (song.key==newSong.key){
            exists=true;
          }
        })
        if (!exists){
          service.list.unshift(snapshot.val());
        }
      });
      fbutil.ref('songs').on('child_removed', function(snapshot) {
        var deletedSong=snapshot.val()
        service.list.forEach(function(song,index){
          if (song.key==deletedSong.key){
            service.list.splice(index,1);
            console.log('found');
          }
        })
      });



      service.fetch=function(callback){
        service.load=service.load+service.batch;
        var more=$firebase(fbutil.ref('songs').orderByChild("key").limitToLast(service.load)).$asArray();
        more.$loaded().then(function() {
          for(var x=0;x<service.batch;x++){
            service.list.push(more[x]);
          }
          callback();
        });
      }
      return service;
    }])
    .factory('days', ['fbutil', function(fbutil) {
      return fbutil.syncArray('days', {limit: 2000, endAt: null});
    }])
    .factory('artistList', ['fbutil', function(fbutil) {
      return fbutil.syncArray('artists', {limit: 120, endAt: null});
    }])
    .factory('artistPage', ['fbutil','$firebase', function(fbutil,$firebase) {
      var service={}
      service.artist={}
      service.songs=[]
      service.fetchSongs=function(songs,applyToSong){

        angular.forEach(Object.keys(songs||[]).reverse(),function(song_key){
          var song=$firebase(fbutil.ref('songs/'+song_key)).$asObject();
          song.$loaded().then(function(){
            if (applyToSong){
              applyToSong(song);
            }
            if (!service.artist.hasOwnProperty('works'))
              service.artist['works']=[];
            service.artist.works.push(song);
          });
        });
      }
      service.fetch=function(artist_id){
        service.artist=$firebase(fbutil.ref('artists/'+artist_id)).$asObject()
        service.artist['works']=[];
        service.artist.$loaded().then(function(){
          service.fetchSongs(service.artist.songs);
        })
      }

      return service;
    }]);


})();
