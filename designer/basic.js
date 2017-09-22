Schema.addCategory({
	name: "basic",
	text: "基础组件",
	dataAttributes: []
});
Schema.addShape({
	name: "round",
	title: "Source",
	category: "basic",
	props: {
		w: 70,
		h: 70
	},
	path: [{
		actions: {
			ref: "round"
		}
	}]
});
Schema.addShape({
	name: "rectangle",
	title: "Interceptor",
	category: "basic",
	props: {
		w: 100,
		h: 70
	},
	path: [{
		actions: {
			ref: "rectangle"
		}
	}]
});
Schema.addShape({
	name: "triangle",
	title: "Sink",
	category: "basic",
	props: {
		w: 80,
		h: 70
	},
	textBlock: [{
		position: {
			x: "10",
			y: "h*0.25",
			w: "w-20",
			h: "h*0.75"
		}
	}],
	anchors: [{
		x: "w/2",
		y: "0"
	}, {
		x: "w/2",
		y: "h"
	}, {
		x: "w*0.25",
		y: "h/2"
	}, {
		x: "w*0.75",
		y: "h/2"
	}],
	path: [{
		actions: [{
			action: "move",
			x: "w/2",
			y: "0"
		}, {
			action: "line",
			x: "w",
			y: "h"
		}, {
			action: "line",
			x: "0",
			y: "h"
		}, {
			action: "close"
		}]
	}]
});