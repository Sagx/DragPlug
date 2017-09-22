$(function() {
	CLB.init()
});
var CLB = {
	socket: null,
	clientId: null,
	url: "",
	unloaded: false,
	init: function() {
		var b = Math.random();
		var a = (b + new Date().getTime());
		this.clientId = a.toString(16).replace(".", "");
		this.startListen();
		window.onbeforeunload = function() {
			try {
				if (CLB.sending || CLB.messageQueue.length > 0) {
					return "您的修改尚未保存，如果离开，您的编辑可能会丢失！"
				}
			} catch (c) {}
			CLB.unloaded = true
		}
	},
	connection: null,
	listenFlag: true,
	listen: function(a) {
		if (this.listenFlag == false || CLB.connection != null) {
			return
		}
		CLB.connection = $.ajax({
			url: "/diagraming/listen",
			data: {
				clientId: CLB.clientId,
				subject: chartId,
			},
			type: "get",
			success: function(b) {
				CLB.connection = null;
				CLB.onMessage(b.events);
				if (typeof b.onlineUsers != "undefined") {
					CLB.manageOnlineUsers(b.onlineUsers)
				}
			},
			error: function(b) {
				CLB.connection = null;
				if (CLB.unloaded == false) {
					if (a) {
						a()
					} else {
						CLB.listen(function() {
							CLB.listenFlag = false
						})
					}
				}
			}
		})
	},
	startListen: function() {
		this.listenFlag = true;
		//this.listen()
	},
	stopListen: function() {
		this.listenFlag = false;
		if (CLB.connection) {
			CLB.connection.abort()
		}
		CLB.connection = null
	},
	sending: false,
	onlineStatus: "on",
	messageQueue: [],
	send: function(c) {
		var b = {
			clientId: CLB.clientId,
		};
		var a = $.extend(b, c);
		this.messageQueue.push(a);
		if (this.sending == false) {
		}
	},
	sendErrorCount: 0,
	localSaveCount: 0,
	sendDirectly: function(b, e) {
		var d = {
			clientId: CLB.clientId,
		};
		var c = $.extend(d, b);
		var a = JSON.stringify(c);
		$.ajax({
			url: "/diagraming/msg_directly",
			data: {
				msgStr: a,
				ignore: "msgStr",
				chartId: chartId
			},
			cache: false,
			type: "post",
			success: function(f) {
				if (e) {
					e(f)
				}
			}
		})
	},
	onMessage: function(b) {
		for (var a = 0; a < b.length; a++) {
			var d = b[a];
			var c = d.action;
			if (c == "refresh") {
				CLB.listenTime = d.listenTime;
				CLB.listen()
			} else {
				if (c == "join") {
					if ($("#chat_user_" + d.userId).length == 0) {
						$("#collaborators").append("<img id='chat_user_" + d.userId + "' src='" + d.photoUrl + "' class='' title='" + d.name + "'/>")
					}
				} else {
					if (c == "leave") {
						if (d.userId != userId) {
							$("#chat_user_" + d.userId).remove()
						}
					} else {
						if (c == "changeTitle") {
							if (d.clientId != this.clientId) {
								$(".diagram_title").text(d.title)
							}
						} else {
							if (c == "chat") {
								if (d.clientId != this.clientId) {
									this.appendChatMsg(d.name, d.message, true)
								}
							} else {
								if (c == "changeSchema") {
									if (d.clientId != this.clientId) {
										if (d.categories == "") {
											Designer.setSchema([])
										} else {
											Designer.setSchema(d.categories.split(","))
										}
									}
								} else {
									if (c == "command") {
										if (d.clientId != this.clientId) {
											MessageSource.receive(d.messages)
										}
									} else {
										if (c == "addHistory") {
											if (Dock.historyVersions != null && d.clientId != this.clientId) {
												Dock.loadHistorys()
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	},
	offlineRemind: true,
	offline: function() {
		this.onlineStatus = "off";
		this.sending = false;
		if (this.offlineRemind) {
			UI.showTip("与服务器连接不稳定，文件暂时保存到本地，连接正常时会自动同步到服务器，期间请不要关闭或者刷新浏览器！！！<a href='javascript:' style='margin-left: 10px;color:#0080FF' onclick='CLB.notRemindOffline()'>不再提醒</a>", "left")
		}
		CLB.doSend()
	},
	online: function() {
		UI.hideTip();
		this.onlineStatus = "on";
		this.doSend()
	},
	notRemindOffline: function() {
		this.offlineRemind = false;
		UI.hideTip()
	},
	showDisconnected: function() {
		$("#disconnected").dlg({
			closable: false
		})
	},
	findLocal: function() {
		var a = false;
		if (localStorage && localStorage["def_local_" + chartId]) {
			var d = localStorage["def_local_" + chartId];
			var c = parseInt(localStorage["version_local_" + chartId]);
			var b = parseInt(localStorage["title_local_" + chartId]);
			if (c >= chartVersion) {
				Designer.open(d);
				a = true
			} else {
				this.removeLocal()
			}
		}
		return a
	},
	removeLocal: function() {
		localStorage.removeItem("def_local_" + chartId);
		localStorage.removeItem("title_local_" + chartId);
		localStorage.removeItem("version_local_" + chartId)
	},
	manageOnlineUsers: function(b) {
		$("#collaborators").children().attr("class", "");
		for (var c = 0; c < b.length; c++) {
			var a = b[c];
			if ($("#chat_user_" + a.userId).length == 0) {
				$("#collaborators").append("<img id='chat_user_" + a.userId + "' src='" + a.photoUrl + "' title='" + a.name + "' title_pos='top'/>")
			}
			$("#chat_user_" + a.userId).attr("class", "online")
		}
		$("#collaborators").children("img[class!=online]").remove()
	},
	showChatWin: function() {
		if ($("#open_chat_btn").button("isSelected")) {
			CLB.closeChatWin();
			return
		}
		$("#open_chat_btn").button("select");
		$("#chattingbox").css("left", $("#shape_panel").outerWidth()).show();
		$("#chatting_edit").focus().unbind().bind("keydown", function(a) {
			if (a.keyCode == 13) {
				if ($.trim($(this).val()) == "") {
					return
				}
				CLB.sendChatMsg();
				return false
			}
		});
		$("#chat_prompt").hide().text("0")
	},
	closeChatWin: function() {
		$("#chattingbox").hide();
		$("#open_chat_btn").button("unselect")
	},
	sendChatMsg: function() {
		var b = $("#chatting_edit").val();
		if (b == "") {
			$("#chatting_edit").focus();
			return
		}
		var a = {
			action: "chat",
			message: b,
			name: userName
		};
		CLB.sendDirectly(a);
		this.appendChatMsg(userName, b, false);
		$("#chatting_edit").val("").focus()
	},
	appendChatMsg: function(c, d, b) {
		d = Utils.filterXss(d);
		d = d.replace(/\n/g, "<br/>");
		$("#chat_messages").append("<li><span>" + c + "</span>:&nbsp;" + d + "</li>");
		$("#chat_messages").scrollTop(9999999);
		if (b && !$("#open_chat_btn").button("isSelected")) {
			var a = parseInt($("#chat_prompt").text()) + 1;
			$("#chat_prompt").show().text(a).animate({
				top: "-15px"
			}, 200).animate({
				top: "-9px"
			}, 200)
		}
	},
	setConfig: function(b, a) {
		$.ajax({
			url: "/diagraming/config",
			data: {
				field: b,
				value: a
			},
			cache: false,
			type: "post",
			success: function() {}
		})
	}
};