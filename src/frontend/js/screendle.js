var Screendle = function() {
    var that = this;

    /***
     * Clock Offset Module
     *
     * The Kindle clock is very inaccurate, which is normally corrected when
     * the screen saver is active (probably via NTP). Since we have disabled
     * the screen saver, we need to periodically fetch the correct time from
     * the api server (which hopefully has ntpd running).
     * Kindle Browser's Date Object also always seem to live in UTC time zone
     * so we use a time zone configured on the server as well.
     * Other modules can subscribe to get notified if the clock or timezone
     * offset has changed.
     */
    that.clockOffset = new function(screendle) {
        var that = this;

        that._subscribers = [];
        that._currentTimezoneOffset = 0;
        that._currentClockOffset = 0;

        /**
         * get clock and timezone offset
         * @returns {number} sum of clock and timezone offset (in milliseconds)
         */
        that.get = function() {
            return that._currentTimezoneOffset + that._currentClockOffset;
        };

        /**
         * get only timezone offset
         * @returns {number} timezone offset (in milliseconds)
         */
        that.getTimezoneOffset = function() {
            return that._currentTimezoneOffset
        };

        /**
         * Get a new Date() object with offset and timezone corrections applied
         * @returns {Date} current Date object
         */
        that.getCorrectDate = function() {
            var now = new Date();
            now.setTime(now.getTime() + that.get());
            return now;
        };

        /**
         * subscribe to changes of the clock or timezone offset
         * @param {function} callback - will be called when an offset has changed
         */
        that.subscribe = function(callback) {
            that._subscribers.push(callback);
        };

        /**
         * Check backend API for current time
         * @access private
         */
        that._tick = function() {
            $.get('/time', function(data, textStatus, jqXHR) {
                var oldTimezoneOffset = that._currentTimezoneOffset;
                var oldClockOffset = that._currentClockOffset;
                that._currentTimezoneOffset = data.zoneOffset * 60 * 1000;
                that._currentClockOffset = data.utc - (new Date()).getTime();
                if (that._currentTimezoneOffset != oldTimezoneOffset || that._currentClockOffset != oldClockOffset) {
                    // clock or timezone offset has changed
                    that._notifySubscribers();
                }
            });
        };

        /**
         * Notify all subscribers by calling their callbacks
         * @access private
         */
        that._notifySubscribers = function() {
            for (var i = 0; i < that._subscribers.length; ++i) {
                that._subscribers[i](that);
            }
        };

        /**
         * Start the clock offset module
         */
        that.start = function() {
            that._tick();
            window.setInterval(that._tick, 10 * 60 * 1000);
        };

    }(that);

    /***
     * Clock Module
     * 
     * Displays current time and Date, with localizable months and weekdays.
     * Seconds are not displayed to avoid updating the ePaper screen too often.
     * The displayed time is still accurate to about 1 second.
     * 
     * Depends on Clock Offset Module
     */
    that.clock = new function(screendle) {
        var that = this;

        that.weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        that.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        that.dateElem = null;
        that.timeElem = null;

        /**
         * attach to a DOM element
         * @access private
         * @param {DOMNode} elem
         */
        that._attach = function(elem) {
            elem.innerHTML = '<div id="date"></div><div id="time"></div>';
            that.dateElem = elem.querySelector('#date');
            that.timeElem = elem.querySelector('#time');
        };

        /**
         * Update the Clock
         * @access private
         */
        that._tick = function() {
            // this function gets called every second, so we try to make it cheap
            // - no DOM lookups
            // - also no jQuery
            // - only update HTML if it actually has changed (prevents screen updates and conserves energy)
            var now = screendle.clockOffset.getCorrectDate();
            var formattedDate = that.weekdays[now.getUTCDay()] + '<br>' + now.getUTCDate() + '. ' + that.months[now.getUTCMonth()];
            var formattedTime = ('0' + now.getUTCHours()).substr(-2) + ':' + ('0' + now.getUTCMinutes()).substr(-2);

            if (that.dateElem.innerHTML != formattedDate) {
                // date has changed
                that.dateElem.innerHTML = formattedDate;
            }

            if (that.timeElem.innerHTML != formattedTime) {
                // time has changed
                that.timeElem.innerHTML = formattedTime;
            }
        };

        /**
         * Start the clock module
         * @param {DOMNode} elem - DOM Node into which the output will be rendered
         * @param {array} weekdays - Localized Weekday Names (array of 7 strings)
         * @param {array} months - Localized Month Names (array of 12 strings)
         */
        that.start = function(elem, weekdays, months) {
            that.weekdays = weekdays;
            that.months = months;
            that._attach(elem);
            that._tick();
            window.setInterval(that._tick, 1 * 1000);
        };

    }(that);

    /***
     * Blackout Module
     *
     * The Kindle ePaper screen accumulates ghosting and shadows of old contents over time.
     * The easiest way to get rid of that is to periodically fill the entire screen with solid black.
     * We do this by setting the background color to black and hiding the body for 500ms every 3 hours.
     */
    that.blackout = new function(screendle) {
        var that = this;

        that.$body = null;

        /**
         * Attach to HTML Body
         * @access private
         * @param {DOMNode} body - DOM Node of HTML body element
         */
        that._attach = function(body) {
            that.$body = $(body);
        };

        /**
         * black out the entire body
         * @access private
         */
        that._blackout = function() {
            that.$body.css('background', '#000').css('opacity', 0);
        };

        /**
         * reactivate the body (undoes the blackout)
         * @access private
         */
        that._reactivate = function() {
            that.$body.css('background', '').css('opacity', 1)
        };

        /**
         * black out and reactivate after a short period
         * @access private
         */
        that._tick = function() {
            that._blackout();
            window.setTimeout(that._reactivate, 500);
        };

        /**
         * Start the blackout module
         * @param {DOMNode} body - DOM Node of HTML body element
         */
        that.start = function(body) {
            that._attach(body);
            window.setInterval(that._tick, 3 * 60 * 60 * 1000);
        };

    }(that);

    /***
     * Weather Module
     * 
     * Shows the current temperature and weather conditions as well as a 
     * (scrollable) forecast of the next few hours.
     * 
     * Depends on Clock Offset Module
     */
    that.weather = new function(screendle) {
        var that = this;

        that._data = null;
        that.$tempElem = null;
        that.$summaryElem = null;
        that.$forecastSummaryElem = null;
        that.$forecastElem = null;
        that._numForecastHours = 14;

        /**
         * attach to HTML element
         * @access private
         * @param {DOMNode} weatherElem - DOM Node into which the output will be rendered
         */
        that._attach = function(weatherElem) {
            var html = '';
            html += '<table><tbody>';
            html += '  <tr><td id="temp" rowspan="2"></td><td id="summary"></td></tr>';
            html += '  <tr><td id="forecast-summary"></td></tr>';
            html += '</tbody></table>';
            html += '<hr>';
            html += '<div id="forecast"></div>';
            weatherElem.innerHTML = html;
            that.$tempElem = $('#temp', weatherElem);
            that.$summaryElem = $('#summary', weatherElem);
            that.$forecastSummaryElem = $('#forecast-summary', weatherElem);
            that.$forecastElem = $('#forecast', weatherElem);
        };

        /**
         * render weather data into HTML output
         * @access private
         * @param {object} weather - weather data as returned from the API
         * @returns {string} weather data HTML
         */
        that._render = function(weather) {
            if (!weather) {
                // this function might get called before data has been loaded
                return;
            }

            // render current temperature, summary and broad forecast
            that.$tempElem.html(Math.round(weather.currently.temperature) + '° C');
            that.$summaryElem.html(weather.currently.summary);
            that.$forecastSummaryElem.html(weather.hourly.summary);

            // render hourly forecast
            var forecastHtml = '';
            forecastHtml += '<table><tbody>';

            // render the hour labels
            forecastHtml += '<tr class="hours">';
            for (var i = 1; i < that._numForecastHours; ++i) {
                var hour = weather.hourly.data[i];
                var hourTs = new Date((hour.time * 1000) + screendle.clockOffset.getTimezoneOffset());
                forecastHtml += '<td>';
                forecastHtml += hourTs.getUTCHours() + ':' + (('0' + hourTs.getUTCMinutes()).substr(-2));
                forecastHtml += '</td>';
            }
            forecastHtml += '</tr>';

            // render the temperatures for every hour
            forecastHtml += '<tr class="temperatures">';
            for (var i = 1; i < that._numForecastHours; ++i) {
                var hour = weather.hourly.data[i];
                forecastHtml += '<td>' + Math.round(hour.temperature) + '°' +'</td>';
            }
            forecastHtml += '</tr>';

            // render the short summaries for every hour
            forecastHtml += '<tr class="summaries">';
            for (var i = 1; i < that._numForecastHours; ++i) {
                var hour = weather.hourly.data[i];
                forecastHtml += '<td>' + hour.summary +'</td>';
            }
            forecastHtml += '</tr>';

            forecastHtml += '</tbody></table>';
            that.$forecastElem.html(forecastHtml);
        };

        /**
         * fetch new weather data from backend and render it
         * @access private
         */
        that._tick = function() {
            $.get('/weather', function(data, textStatus, jqXHR) {
                that._data = data;
                that._render(data);
            });
        };

        /**
         * Start the weather module
         * @param {DOMNode} elem - DOM Node into which the output will be rendered
         */
        that.start = function(elem) {
            that._attach(elem);
            screendle.clockOffset.subscribe(function(clockOffset) {
                that._render(that._data);
            });
            that._tick();
            window.setInterval(that._tick, 3 * 60 * 1000);
        };
    }(that);

    /***
     * Public Transport Module
     */
    that.publicTransport = new function(screendle) {
        var that = this;

        that.$bussesElem = null;
        that.$trainsElem = null;

        /**
         * attach to HTML Element
         * @access private
         * @param {DOMNode} elem - DOM Node into which the output will be rendered
         */
        that._attach = function(elem) {
            var html = '';
            html += '<table id="departures">';
            html += '    <tr>';
            html += '        <td id="busses"></td>';
            html += '        <td id="trains"></td>';
            html += '    </tr>';
            html += '</table>';
            elem.innerHTML = html;
            that.$bussesElem = $('#busses', elem);
            that.$trainsElem = $('#trains', elem);
        };

        /**
         * render departure data into HTML
         * @access private
         * @param {object} departures - departure data received from API
         * @param {string} caption - caption for output table
         * @returns {string} HTML of rendered output
         */
        that._render = function(departures, caption) {
            var html = '';
            html += '<table>';
            html += '<caption>' + caption + '</caption>';
            html += '<tbody>'
            for (var i in departures) {
                if (i >= 5) {
                    break;
                }
                html += '<tr class="' + (i%2 == 0 ? 'even' : 'odd') + '">';
                html += '<td class="line">' + departures[i].line + '</td>';
                html += '<td class="direction">' + departures[i].direction.replace(/ \(.*\)$|, .*$/, '') + '</td>';
                html += '<td class="time">';
                html += departures[i].time;
                if (departures[i].hasDelay) {
                    html += '<span class="delay"> ' + departures[i].delay + '</span>';
                }
                html += '</td>';
                html += '</tr>';
            }
            html += '</tbody></table>';
            return html;
        };

        /**
         * get new departure data from backend
         * @access private
         * @param {string} endpoint - API endpoint (URL or path) to call
         * @param {string} $elem - jQuery object into which the output will be rendered
         * @param {string} caption - caption for output HTML
         */
        that._tick = function(endpoint, $elem, caption) {
            $.get(endpoint, function(data, textStatus, jqXHR) {
                $elem.html(that._render(data.data.attributes.departures, caption));
            });
        };

        /**
         * Start public transport module
         * @param {DOMNode} elem - DOM Node into which the output will be rendered
         * @param {string} bussesCaption - caption for busses output
         * @param {string} trainsCaption - caption for trains output
         */
        that.start = function(elem, bussesCaption, trainsCaption) {
            that._attach(elem);
            that._tick('/busses', that.$bussesElem, bussesCaption);
            that._tick('/trains', that.$trainsElem, trainsCaption);
            window.setInterval(that._tick, 1 * 60 * 1000, '/busses', that.$bussesElem, bussesCaption);
            window.setInterval(that._tick, 2 * 60 * 1000, '/trains', that.$trainsElem, trainsCaption);
        };

    }(that);

    /***
     * Hue Rooms Module
     * 
     * Provides an array of buttons that can switch Hue lights on or off.
     * Every button has a `state` data-attribute denoting whether the lights in this room are on or off.
     */
    that.rooms = new function(screendle) {
        var that = this;

        that.elem = null;

        /**
         * update information about rooms and light states
         * @access private
         */
        that._tick = function() {
            $.get('/rooms', function(data, textStatus, jqXHR) {
                var rooms = data;

                // re-rendering the HTML takes some time during which the buttons cannot be used.
                // so if a user tries to switch off multiple rooms in short succession and the HTML
                // would be re-rendered after the first button-press, the subsequent button presses
                // would not trigger events.
                // Therefore, we avoid re-rendering the HTML by checking if every room already has a corresponding button
                var roomsAreUpToDate = true;

                // check if the rooms on the bridge have changed since the last time the HTML was rendered
                if ($('.room', that.elem).length !== Object.keys(rooms).length) {
                    // the number of rooms has changed
                    roomsAreUpToDate = false;
                }
                for (var roomId in rooms) {
                    // a room was added to the bridge that has no corresponding button (yet)
                    if ($('.room[data-room-id=' + roomId + ']', that.elem).length == 0) {
                        roomsAreUpToDate = false;
                        break;
                    }
                }

                if (roomsAreUpToDate) {
                    // every room on the brige already has a button (which is the norm)
                    for (var roomId in rooms) {
                        var $room = $('.room[data-room-id=' + roomId + ']', that.elem);
                        // make sure every button still has the correct label (i.e. name of the room)
                        if ($room.html() != rooms[roomId].name) {
                            $room.html(rooms[roomId].name);
                        }
                        // make sure every button reflects the current on/off state
                        if ($room.data('state') != rooms[roomId].state.all_on) {
                            $room.data('state', rooms[roomId].state.all_on);
                            $room.attr('data-state', rooms[roomId].state.all_on);
                        }
                    }
                } else {
                    // either this is the first time we are loading the rooms or the rooms have
                    // changed on the bridge - it is necessary to re-render the buttons
                    var roomsHtml = '';
                    for (var roomId in rooms) {
                        roomsHtml += '<button class="room" type="button" data-room-id="' + roomId + '" data-state="' + (rooms[roomId].state.all_on) + '">' + rooms[roomId].name + '</button>';
                    }
                    $(that.elem).html(roomsHtml);
                }
            });
        };

        /**
         * event handler for button click events
         * @access private
         * @param {DOMEvent} event - DOM Event of button click
         */
        that._handleClick = function(event) {
            var $target = $(event.target);
            var newState = !$target.data('state');
            // optimistically update the button state
            $target.data('state', newState);
            $target.attr('data-state', newState);
            $.ajax(
                '/switch',
                {
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        roomId: $target.data('roomId'),
                        on: newState
                    }),
                    complete: function(jqXHR, textStatus) {
                        // switch succeeded so the button state is already correct
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        // switch failed, revert the button state
                        $target.data('state', !newState);
                        $target.attr('data-state', !newState);
                    }
                }
            );
        };

        /**
         * start the rooms module
         * @param {DOMNode} elem - DOM Node into which the output will be rendered
         */
        that.start = function(elem) {
            that.elem = elem;
            $(elem).on('click', 'button', that._handleClick);
            that._tick();
            window.setInterval(that._tick, 10 * 1000);
        };

    }(that);

};
