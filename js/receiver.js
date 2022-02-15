

main();

function main() {
	const CHANNEL 			= 'urn:x-cast:com.tvcast.screenmirror';
	const ctx 				= cast.framework.CastReceiverContext.getInstance();
	const playerManager 	= ctx.getPlayerManager();
	const commands      	= cast.framework.messages.Command;
	const playbackConfig 	= new cast.framework.PlaybackConfig();
	var options 			= new cast.framework.CastReceiverOptions();
	/*
	*	Handle Player
	*/
	playerManager.setMessageInterceptor(cast.framework.messages.MessageType.LOAD, loadRequestData =>{
		const error = new cast.framework.messages.ErrorData(
                      cast.framework.messages.ErrorType.LOAD_FAILED);
      if (!loadRequestData.media) {
        error.reason = cast.framework.messages.ErrorReason.INVALID_PARAM;
        return error;
	  }
	  hideIframe();
	  imageControl.stopStream();
      imageControl.clearImg();
      return loadRequestData;
	});

	/*
	* Handle WebBrowser
	*/
	ctx.addCustomMessageListener(CHANNEL, function(customEvent) {
		var js = customEvent.data;
		if (js.type == 'iframe') {
			showIframe();
			playerManager.stop();
			imageControl.startStream(js.url);

		}else if (js.type == 'close_browser') {
			hideIframe();
			imageControl.stopStream();
		}
	});
	/*
	* Config playback
	*/
	playbackConfig.autoResumeDuration = 1;
	options.playbackConfig 		= playbackConfig;
	options.supportedCommands 	= commands.PAUSE | commands.STREAM_VOLUME | commands.STREAM_MUTE
	ctx.start(options);
}

let imageControl = (function() {
    let self = {};
    self.$image = document.getElementById('image');
    self.$imageWrapper = document.getElementById('image-wrapper');

    self.setImgSrc = function(src) {
        console.log('setImgSrc = ' + src);
        self.$image.src = src;
        self.$imageWrapper.style.display = 'block';
    };

    self.clearImg = function () {
        self.$imageWrapper.style.display = 'none';
    };

    self.streamUrl = null;
    self.streamErrors = 0;
    self.streamTimeout = null;

    self.startStream = function(url) {
	setTimeout(function() {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open('GET', 'https://tv.wonny.net/debug?' + encodeURI(url), false);
            xmlHttp.send(null);
        }, 1);
        self.streamErrors = 0;
        self.streamUrl = url.replace('/1.html','');
        self.$image.onload = function() {
            self.streamNextFrame();
            self.streamErrors = 0;
        };
        self.$image.onerror = function() {
            self.streamNextFrame();
            if (++self.streamErrors >= 100) {
                console.error('Stop streaming after 100 errors');
                self.stopStream();
            }
        };
        self.streamNextFrame();
    };

    self.stopStream = function() {
        self.streamUrl = null;
        self.$image.onload = function() {};
        self.$image.onerror = function() {};
        self.clearImg();
    };

    self.streamNextFrame = function() {
        if (self.streamUrl === null) {
            self.stopStream();
            return;
        }

        let currentTime = (new Date().getTime()) / 1000;
        let url = self.streamUrl + '/screenmirror/name=' + currentTime
        self.setImgSrc(url);

        if (self.streamTimeout !== null) {
            clearTimeout(self.streamTimeout);
        }
        self.streamTimeout = setTimeout(function() {
            ++self.streamErrors;
            self.streamNextFrame();
        }, 1500);
    };

    return self;
})();

function showIframe() {
	document.getElementById("cast_player").style.visibility = 'hidden';
}

function hideIframe() {
	document.getElementById("cast_player").style.visibility = 'visible';
}
