export const KNOWLEDGE_VERSION = '2026-10-16';

export const PROJECT_KNOWLEDGE = `
Pyrolysis of Plastics is an educational Unity visualisation, not a validated chemical process simulator. It illustrates a reactor process; its animation and visual effects do not predict yields, reaction kinetics, commercial viability, or real reactor performance.

Arjun Chandra completed all IT/software development for the Unity application and website, including hosting and web delivery. He managed the product roadmap, wrote user stories and acceptance criteria, prioritised the MVP backlog, managed milestones, and delivered the final Unity application despite resource constraints. Professor and student feedback was qualitative; there are no numerical results proving learning improvement or product impact. Keep answers focused on Arjun's confirmed contribution. Chemical engineering and calculations were outside his responsibility; do not attribute those to him or proactively list other people's credits. Arjun's software work used Blender for 3D models, Unity 6000.0.16f1 for the application, and C# scripts for interactive behaviour. Components include the reactor and screw, particle systems, gravity and physics, box and mesh colliders, Canvas UI, scene navigation, synchronised text, and automatic screw rotation. Universal Render Pipeline helped address flickering or disappearing gas particles. A semitransparent reactor makes its interior visible. Hidden colliders help contain particles. Plastic particles gradually shrink and disappear to depict conversion.

The Home scene has Start and Credits buttons. Start loads Process Animation. Credits identifies the project contributors. In Process Animation, Restart replays the sequence and Back returns to Home. The sequence starts automatically after entering that scene. The website's launch control opens the Unity player, then visitors use its Start button. The web export is hosted online; visitors do not need Unity installed. Loading still requires downloading and initialising the build, and first-visit time varies with connection and device. Preloading the Home scene does not prove the Process Animation scene is ready.

The depicted process feeds pretreated plastic through the inlet, turns a screw, introduces nitrogen to displace air, heats to about 500 degrees C, and depicts polymers breaking into smaller hydrocarbon molecules. Gaseous products leave through the outlet and would need further treatment in a real process. The report describes the outlet as open during this illustrated sequence. This is not sufficient real-world reactor safety guidance. The gas colours communicate stages and temperature; they are visual cues, not literal gas colours. When conversion is depicted as finished, the screw stops.

In general, pyrolysis uses heat in an oxygen-limited or oxygen-free environment to decompose material. It differs from combustion, which uses oxygen to burn fuel. Plastic pyrolysis can yield gas, condensable vapours that form oil or wax, and solid residues. Product proportions depend on feedstock and process conditions; not every plastic is suitable for every process. Nitrogen provides an inert purge and reduces oxygen in the illustrated reactor. 500 degrees C is the temperature depicted by this project, not a universal operating rule. Pyrolysis can help recover material or energy from some waste streams but needs energy, feedstock preparation, product treatment, emissions control, and evaluation. Fuel from fossil-based plastics is not renewable energy. Pyrolysis may complement renewable-energy systems through resource recovery, but do not claim it removes all pollution, reverses climate change or guarantees sustainability.

The website was developed by Arjun Chandra. It presents an overview, a project introduction, the Unity demo, Blender model screenshots and an AI-powered project assistant using GLM-5.3-Flash through LLM7. Prepared FAQs work if live AI is unavailable. It is intended as an educational portfolio demonstration for hiring managers and curious visitors. The chatbot can discuss this project, website controls, and educational pyrolysis concepts. No live experiment, quantitative validation, commercial deployment, measured loading performance, or employment outcome is established by these notes. Explain unsupported details as unknown. Do not turn website plans into features in the Unity application.
`.trim();

const FAQS = [
  { id: 'greeting', pattern: /^(hi|hello|hey)[!.?]*$/i, answer: 'Hello. Ask me about plastic pyrolysis, the simulation or Arjun’s role in this project.' },
  {
    id: 'product-management',
    pattern: /\b(product management|product roadmap|product manager|roadmap|mvp|backlog|prioriti\w*|user stor\w*|acceptance criteria|milestone\w*|resource constraints|feedback|professor\w*|student\w*)\b/i,
    answer: 'Arjun Chandra managed the product roadmap, wrote user stories and acceptance criteria, prioritised the MVP backlog and managed delivery milestones despite resource constraints. Professor and student feedback was qualitative; no numerical learning or impact improvement is claimed.',
  },
  {
    id: 'contribution',
    pattern: /\b(arjun|contribut\w*|who (?:made|built|developed|worked)|your role|his role|team|credit\w*|author\w*)\b/i,
    answer: 'Arjun Chandra defined the product roadmap, prioritised the MVP backlog and led delivery. He built the Unity application, including its Blender models and C# interactions, then developed this website and its AI-powered chat assistant.',
  },
  {
    id: 'nitrogen',
    pattern: /\b(nitrogen|purge|purging|inert|air|oxygen)\b/i,
    answer: 'Nitrogen purges air from the illustrated reactor and helps create an oxygen-poor environment. That lets heat break down the plastic through pyrolysis instead of simply burning it. The yellow colour is a visual cue.',
  },
  {
    id: 'temperature',
    pattern: /\b(500|temperature|heat\w*|red|colour|color)\b/i,
    answer: 'The animation depicts heating to about 500°C. Its changing gas colour communicates the heating stage. This is the project’s illustrated setting; real pyrolysis conditions depend on the feedstock and process.',
  },
  {
    id: 'controls',
    pattern: /\b(start|launch|restart|back|button\w*|control\w*|navigate|navigation|play|replay|use the|how to use)\b/i,
    answer: 'Open the simulation from the website, then select Start on the Unity Home screen. Restart replays the process and Back returns to Home.',
  },
  {
    id: 'loading',
    pattern: /\b(load\w*|slow|browser|webgl|download|device|mobile|phone|screen|fullscreen|full screen)\b/i,
    answer: 'The browser downloads and initialises the Unity Web build before it can run. Let the loading indicator finish, then use Start. Loading time and performance vary with your connection and device; the introduction remains available while it prepares.',
  },
  {
    id: 'technology',
    pattern: /\b(unity|blender|c#|csharp|script\w*|software|technology|technologies|tech stack|urp|render\w*|particle\w*|collider\w*|screw|3d|model\w*|physics)\b/i,
    answer: 'The visualisation combines Blender models, Unity and C# scripts. Particle systems depict plastic and gases, colliders help contain them, and scripts coordinate the screw, scene buttons and text. URP helped resolve gas-particle rendering issues.',
  },
  {
    id: 'evidence',
    pattern: /\b(validat\w*|accura\w*|predict\w*|yield\w*|efficien\w*|measurement\w*|result\w*|calculat\w*|experiment\w*|proof|prove|kinetic\w*)\b/i,
    answer: 'This is an educational visualisation. Its animation does not establish chemical yields, reaction accuracy or real reactor performance. Chemical calculations were outside Arjun’s responsibility, and these notes contain no verified numerical results.',
  },
  {
    id: 'environment',
    pattern: /\b(resource recovery|recover resources|recover materials|renewab\w*|climate|sustainab\w*|environment\w*|recycl\w*|pollut\w*|emission\w*|benefit\w*|eco\w*|green)\b/i,
    answer: 'Pyrolysis can recover useful materials and fuel from some plastic waste. Fuel from fossil-based plastics is not renewable energy. Environmental benefits depend on feedstock, energy use, and treatment of products and emissions.',
  },
  {
    id: 'products',
    pattern: /\b(produc\w*|output\w*|hydrocarbon\w*|oil|wax|char|gas\w*)\b/i,
    answer: 'Plastic pyrolysis produces gases, oil or wax, and solid residues. The oil and gas can be processed into chemical feedstocks or used as fuels. The mix of products depends on the type of plastic and the process conditions.',
  },
  {
    id: 'overview',
    pattern: /\b(pyrolys\w*|plastic\w*|project|website|site|demo|simulation|process|reactor|chat\w*|hello|hi|help)\b/i,
    answer: 'Pyrolysis uses heat with little or no oxygen to break long plastic molecules into smaller ones. This Unity project makes the sequence visible inside a semitransparent reactor, with moving particles, a rotating screw and explanations that follow the animation.',
  },
];

export function getFaq(question) {
  const match = FAQS.find((item) => item.pattern.test(question));
  return {
    answer: match?.answer ?? 'I can explain the project, show you how to use the demo, or introduce pyrolysis. Try asking why nitrogen is used or what Arjun developed.',
    mode: 'faq',
    source: 'Project notes and educational FAQ',
  };
}

export const TOPIC_REFUSAL = Object.freeze({
  answer: 'I can help with this project, the website and educational questions about pyrolysis. Try asking how the animation works or why nitrogen is used.',
  mode: 'refused',
  source: 'Topic guide',
});

