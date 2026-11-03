// ==UserScript==
// @name         Manga Page Auto Clicker (MangaLib Only)
// @name:ru      Автокликер страниц манги (Только для MangaLib)
// @version      0.9
// @description  Скрипт изолирован и работает исключительно на сайтах и зеркалах MangaLib.
// @author       ignor & AI
// @match        *://*.mangalib.me/*
// @match        *://*.mangalib.org/*
// @match        *://*://*
// @match        *://mangalib.me/*
// @match        *://mangalib.org/*
// @match        *://://mangalib.com*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var acInitializer = setInterval(function () {
        if (document.body && document.getElementById("auto-click-div") === null) {
            run();
            clearInterval(acInitializer);
        }
    }, 500);

    function run() {
        var curTask;
        var acMouseX;
        var acMouseY;
        var isRecordMode = false;

        function mouseTrigger(e) {
            if (e.target.closest('#auto-click-div')) return;

            if (isRecordMode) {
                e.preventDefault();
                e.stopPropagation();

                acMouseX = e.clientX;
                acMouseY = e.clientY;
                isRecordMode = false;

                curTask = new CountDownTask(getAcInterval(), refreshUI, autoClick);
                curTask.start();
                return;
            }
        }

        function autoClick() {
            var element = document.elementFromPoint(acMouseX, acMouseY);
            if (element) {
                var ev = new MouseEvent("click", {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: acMouseX,
                    clientY: acMouseY
                });
                element.dispatchEvent(ev);
            }
            curTask = new CountDownTask(getAcInterval(), refreshUI, autoClick);
            curTask.start();
        }

        function stopAutoclick() {
            isRecordMode = false;
            if (curTask) {
                curTask.kill();
                curTask = null;
            }
            refreshUI();
        }

        function keyTrigger(e) {
            if (curTask && curTask.isRunning) {
                if (e.ctrlKey) {
                    curTask.pause();
                    refreshUI();
                } else if (e.keyCode === 27) { // Esc
                    stopAutoclick();
                } else {
                    curTask.restart();
                }
            }
        }

        document.body.addEventListener("keydown", keyTrigger);
        document.body.addEventListener("mousedown", mouseTrigger, true);

        /////////////////////////// UI Оформление /////////////////////////////////
        var acStyle = document.createElement('style');
        acStyle.type = 'text/css';
        acStyle.innerHTML = `
            #auto-click-div { position: fixed; left: 15px; top: 70px; z-index: 9999999; display: flex; gap: 6px; background: rgba(0,0,0,0.15); padding: 5px; border-radius: 6px; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
            #auto-click-button { background: #2196F3; color: white; border: none; padding: 8px 14px; border-radius: 4px; cursor: pointer; font-family: sans-serif; font-size: 13px; font-weight: bold; transition: background 0.2s; }
            #auto-click-stop { background: #f44336; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-family: sans-serif; font-size: 13px; font-weight: bold; display: none; transition: background 0.2s; }
            #auto-click-stop:hover { background: #d32f2f; }
            #auto-click-setting { background: #757575; color: white; border: none; padding: 8px 10px; border-radius: 4px; cursor: pointer; font-family: sans-serif; font-size: 13px; }
            #auto-click-input { width: 55px; padding: 6px; border: 1px solid #ccc; border-radius: 4px; transform: scaleX(0); opacity: 0; transition: opacity .25s, transform .25s; transform-origin: 0 0; font-size: 13px; }
            #auto-click-input.show { transform: scaleX(1); opacity: 1; }
        `;
        document.getElementsByTagName('head').item(0).appendChild(acStyle);

        var acDiv = document.createElement("div");
        acDiv.id = "auto-click-div";

        var acButton = document.createElement("input");
        acButton.id = "auto-click-button";
        acButton.setAttribute("type", "button");
        acButton.value = "Жду старта...";

        var acStopButton = document.createElement("button");
        acStopButton.id = "auto-click-stop";
        acStopButton.innerText = "Стоп 🛑";

        var acSettingButton = document.createElement("input");
        acSettingButton.id = "auto-click-setting";
        acSettingButton.setAttribute("type", "button");
        acSettingButton.value = "⚙️ " + getAcInterval() + "с";

        var acInput = document.createElement("input");
        acInput.id = "auto-click-input";
        acInput.setAttribute("type", "number");
        acInput.setAttribute("min", "1");
        acInput.setAttribute("max", "999");

        acDiv.appendChild(acButton);
        acDiv.appendChild(acStopButton);
        acDiv.appendChild(acSettingButton);
        acDiv.appendChild(acInput);
        document.body.appendChild(acDiv);

        acButton.onclick = function(e) {
            e.stopPropagation();
            if (curTask && curTask.isRunning) return;

            if (!isRecordMode) {
                isRecordMode = true;
                this.value = "Укажите точку клика...";
                this.style.background = "#ff9800";
            } else {
                isRecordMode = false;
                refreshUI();
            }
        };

        acStopButton.onclick = function(e) {
            e.stopPropagation();
            stopAutoclick();
        };

        acSettingButton.onclick = function(e) {
            e.stopPropagation();
            var clzList = document.getElementById('auto-click-input').classList;
            if (clzList.contains("show")) {
                var inputVal = parseInt(document.getElementById('auto-click-input').value);
                if (inputVal >= 1 && inputVal <= 999) {
                    setAcInterval(inputVal);
                }
                this.value = "⚙️ " + getAcInterval() + "с";
                clzList.remove("show");
            } else {
                clzList.add("show");
                document.getElementById('auto-click-input').value = getAcInterval();
                document.getElementById('auto-click-input').focus();
            }
        };

        function refreshUI() {
            var btn = document.getElementById("auto-click-button");
            var stopBtn = document.getElementById("auto-click-stop");
            if (!btn || !stopBtn) return;

            if (curTask && curTask.isRunning) {
                stopBtn.style.display = "block";
                if (curTask.paused) {
                    btn.value = "Пауза..." + curTask.timeLeft + "с";
                    btn.style.background = "#ff9800";
                } else {
                    btn.value = "Клик через " + curTask.timeLeft + "с";
                    btn.style.background = "#4CAF50";
                }
            } else {
                stopBtn.style.display = "none";
                if (isRecordMode) {
                    btn.value = "Укажите точку клика...";
                    btn.style.background = "#ff9800";
                } else {
                    btn.value = "Жду старта...";
                    btn.style.background = "#2196F3";
                }
            }
        }

        function CountDownTask(interVal, eachDo, endDo) {
            this.timeLeft = interVal;
            this.eachDo = eachDo;
            this.endDo = endDo;
            this.intervalNum = 0;
            this.isRunning = false;
            this.paused = false;
        }

        CountDownTask.prototype.start = function() {
            var that = this;
            that.isRunning = true;
            that.eachDo();

            that.intervalNum = setInterval(function() {
                if (that.paused) return;

                if (that.timeLeft > 1) {
                    that.timeLeft -= 1;
                    that.eachDo();
                } else {
                    clearInterval(that.intervalNum);
                    that.isRunning = false;
                    that.endDo();
                }
            }, 1000);
        };

        CountDownTask.prototype.restart = function() {
            this.kill();
            this.timeLeft = getAcInterval();
            this.start();
        };

        CountDownTask.prototype.pause = function() {
            this.paused = !this.paused;
        };

        CountDownTask.prototype.kill = function() {
            clearInterval(this.intervalNum);
            this.isRunning = false;
        };

        function getAcInterval() {
            var interval = parseInt(localStorage.getItem("auto-click-interval"));
            return (interval >= 1) ? interval : 1;
        }

        function setAcInterval(interval) {
            localStorage.setItem("auto-click-interval", interval.toString());
        }
    }
})();
