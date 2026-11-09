import './polyfills.server.mjs';
var e=["NATURE_AND_HILLS","BEACHES","FOREST_AND_WILDLIFE","HISTORY_AND_CULTURE","SPIRITUAL_PLACES"];function a(t,o){if(typeof t!="object"||t===null||!("destination"in t))return null;let i=t.destination;if(typeof i!="object"||i===null)return null;let n=i;return n.id!==o||typeof n.name!="string"||typeof n.state!="string"||!e.includes(n.category)?null:n}export{a};
