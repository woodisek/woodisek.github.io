// Manifest všech aplikací - stačí přidat nový objekt pro novou aplikaci
export const apps = [
{
    id: 'copy-emoji',
    name: 'Copy Emoji',
    description: 'Kopíruj emoji jedním kliknutím',
    icon: '😃',
    css: './apps/copy-emoji.css',  // ← pokud máš CSS
    component: () => import('./apps/copy-emoji.js')
},
{
    id: 'font-viewer',
    name: 'Ukázka fontů',
    description: 'Vyzkoušej si různé fonty na svém textu',
    icon: '🔤',
    css: './apps/font-viewer.css',
    component: () => import('./apps/font-viewer.js')
},
{
    id: 'age-calculator',
    name: 'Kalkulačka věku',
    description: 'Zjisti přesný věk z data narození',
    icon: '🎂',
    css: './apps/age-calculator.css',
    component: () => import('./apps/age-calculator.js')
},
{
    id: 'fuel-calculator',
    name: 'Kalkulačka spotřeby',
    description: 'Spočítej cenu za cestu a spotřebu paliva',
    icon: '⛽',
    css: './apps/fuel-calculator.css',
    component: () => import('./apps/fuel-calculator.js')
},
/*{
    id: 'handpan',
    name: 'Handpan virtuální nástroj',
    description: 'Hraj na virtuální handpan',
    icon: '🎵',
    css: './apps/handpan.css',
    component: () => import('./apps/handpan.js')
},*/
{
    id: 'find-replace',
    name: 'Find & Replace',
    description: 'Rychlé hledání a nahrazování v textu',
    icon: '🔍',
    css: './apps/find-replace.css',
    component: () => import('./apps/find-replace.js')
},
{
    id: 'fact-generator',
    name: 'Generátor faktů',
    description: 'Nauč se něco nového každý den',
    icon: '💡',
    css: './apps/fact-generator.css',
    component: () => import('./apps/fact-generator.js')
},
{
    id: 'departure-planner',
    name: 'Time Backplanner',
    description: 'Naplánuj si cestu',
    icon: '🚗',
    css: './apps/departure-planner.css',
    component: () => import('./apps/departure-planner.js')
},
{
    id: 'color-picker',
    name: 'Color Picker',
    description: 'Výběr barvy a převod mezi formáty',
    icon: '🎨',
    css: './apps/color-picker.css',
    component: () => import('./apps/color-picker.js')
},
{
    id: 'metronome',
    name: 'Metronom',
    description: 'Udržuj tempo a trénuj rytmy',
    icon: '🕰️',
    css: './apps/metronome.css',
    component: () => import('./apps/metronome.js')
},
{
    "id": "frequency-generator",
    "name": "Frekvenční generátor",
    "description": "Generuj tóny o různých frekvencích",
    "icon": "🧘‍♀️",
    "css": "./apps/frequency-generator.css",
    "component": () => import("./apps/frequency-generator.js")
},
{
    "id": "noise-meter",
    "name": "Měřič hluku",
    "description": "Měří okolní hluk pomocí mikrofonu",
    "icon": "🎤",
    "css": "./apps/noise-meter.css",
    "component": () => import("./apps/noise-meter.js")
},
{
    "id": "bmi-calculator",
    "name": "BMI Kalkulačka",
    "description": "Spočítej si své BMI a sleduj zdraví",
    "icon": "⚖️",
    "css": "./apps/bmi-calculator.css",
    "component": () => import("./apps/bmi-calculator.js")
},
];
