/* jshint strict: false */
(function ($) {
	$.fn.HexViewer = function (binData, conf) {

		/**
		 *   Returns the two digit Hex code.
		 *   Example:
		 *       0 ==> 00
		 *       224 ==> E0
		 **/
		function byteToHex(b) {
			var hexChar = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
			return hexChar[(b >> 4) & 0x0f] + hexChar[b & 0x0f];
		}

		/**
		 *	Returns Hex Word String
		 *   Example:
		 *       255 ==> 000000FF
		 **/
		function decToHexWord(dec) {
			var str = '';
			for (var i = 3; i >= 0; i--) {
				str += byteToHex((dec >> (i * 8)) & 255);
			}
			return str;
		}

		function removeWhitespace(str) {
			return str.replace(/\n/g, '')
				.replace(/\t/g, '')
				.replace(/ /g, '')
				.replace(/\r/g, '');
		}

        var conf = conf || {};
		var params = {};

		params.bytesPerLine = conf.bytesPerLine || 16;
		params.wordSize = conf.wordSize || 1; //Bytes to display in each word.
		params.hide0x = conf.hide0x || true; //Show or hide 0x in word display
		params.hexLineNumbers = conf.hexLineNumbers || true; //Display Word Line Numbers in Decimal or Hex
		params.startByte1 = conf.startByte1 || false;

		var hexView = $('<table>').addClass('hexView').attr('id', 'hexView');
		var offset = (params.startByte1 ? 1 : 0);
        var tHead = $('<thead>').addClass('hexViewHead');
        tHead.append($('<td>').addClass('hexViewCode'));
        tHead.append($('<td>').addClass('hexViewCode').html('&nbsp;'));
        for(var i=0; i< params.bytesPerLine; i++)
        {
            tHead.append($('<td>').html(byteToHex(i)).addClass('hexViewCode'));
        }
        tHead.append($('<td>').addClass('hexViewCode').html('&nbsp;'));
        tHead.append($('<td>').addClass('hexViewCode'));
        hexView.append(tHead);
		while (binData.length > 0) {
			var lineData = binData.slice(0, params.bytesPerLine);
			binData = binData.slice(params.bytesPerLine);

			var tRow = $('<tr>').addClass('hexViewRow');
			hexView.append(tRow);

			var tOffset = $('<td>').addClass('hexViewOffset');
			tOffset.html(params.hexLineNumbers ? '0x' + decToHexWord(offset) : '00000000' + offset.slice(-8));
			tRow.append(tOffset);

            tRow.append($('<td>').addClass('hexViewCode').html('&nbsp;'));
			for (var i = 0; i < lineData.length; i += params.wordSize) {
				var num = '';
				for (var j = 0; j < params.wordSize; j++) {
					num += byteToHex(lineData[i + j]);
				}
				var tWord = $('<td>').html((params.hide0x ? '' : '0x') + num).addClass('hexViewCode');
				tRow.append(tWord);
			}
            if (lineData.length < params.bytesPerLine){
				tWord.attr('colspan', Math.floor((params.bytesPerLine - lineData.length) / params.wordSize) + 1);
			}

            tRow.append($('<td>').addClass('hexViewCode').html('&nbsp;'));
			var text = '';
			for (var i = 0; i < lineData.length; i++) {
                var cc = lineData[i];
                if ((cc >= 32) && (cc <= 126))
                {
                    text = text + String.fromCharCode(lineData[i]);
                }
                else
                {
                    text = text + '.';
                }
			}
			var tByte = $('<td>').addClass('hexViewBytes');
			tByte.html(text);
			tRow.append(tByte);

			offset += params.bytesPerLine;
		}

		this.html(hexView);
        return this;
	};
})($);
