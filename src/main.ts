import { createRouter, createWebHistory } from "vue-router";
import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: "/",
			component: () => import("./pages/login.vue"),
		},
		{
			path: "/broker",
			component: () => import("./pages/broker.vue"),
		},
		{
			path: "/admin",
			component: () => import("./pages/admin.vue"),
		},
	],
});

createApp(App).use(router).mount("#app");
