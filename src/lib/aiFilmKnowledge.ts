// AI Filmmaking Playbook — the grounded, practitioner-level knowledge the blog
// writer draws on so posts read like they were written by someone who actually
// makes AI films, not a generalist.
//
// DELIBERATELY CAPABILITY-FIRST, NOT SPEC-FIRST. This field ships new model
// versions monthly and prices/benchmarks/version numbers are already
// contradictory across sources — baking them in would date every post and risk
// being wrong. So this captures what tools are *best at*, the real workflows,
// the practical challenges, and the vocabulary — the parts that age well.
// Compiled from current (mid-2026) practitioner research; refresh periodically.

export const AI_FILM_KNOWLEDGE = `AI FILMMAKING PLAYBOOK (practitioner knowledge — write from this):

THE CORE TRUTH OF THE CRAFT: Nobody serious ships a single text-to-video prompt. Real work is a multi-tool "workflow stack": generate stills → animate → add audio → upscale/finish. You cast a different model for each shot the way a director casts for a role. Image-to-video — animating a controlled still — is the backbone, not text-to-video.

VIDEO MODELS — what each is genuinely best at (name them freely and honestly):
- Google Veo: the safest all-rounder. Its edge is native synchronized audio generated in the same pass — dialogue, ambience and lip-sync come out with the picture, not dubbed on after. Strong prompt adherence and realistic establishing/dialogue shots. Short base clips you extend by chaining. Accessed with camera controls and start/end-frame interpolation.
- Kling: cinematic motion and physics — hair, fabric, liquids, tracking shots — and widely considered the best at image-to-video ("bring a hero still to life"). Multi-shot storyboard mode holds subjects across cuts. High reroll rate, so budget for rejects.
- Runway: the control pick. Granular camera moves, Motion Brush, and performance capture (Act-One/Act-Two) — drive a character's face, and even body and hands, from your own acted reference video. Chosen when a shot needs precise choreography.
- Seedance (ByteDance): strongest for multi-shot, reference-driven continuity and commercial/ad work — heavy multimodal reference control (many reference images/clips) plus native audio and multilingual lip-sync.
- Luma (Ray): keyframe-level direction — feed a start and end frame and it fills the motion between; visual annotation; an HDR pipeline; and "Modify" to restyle real footage while keeping the original performance. Great for stylized looks and evolving a real scene.
- MiniMax Hailuo: the physics/motion specialist — convincing human movement (dance, sport, athletics) and cheap iteration. No native audio, no end-frame control, and character identity drifts across separate clips.
- Pika: fast short-form/social effects engine — signature physics effects (melt, explode, inflate), keyframe transitions, object insert/swap. Not a realism or long-form leader.
- Higgsfield: not a base model — an aggregator + director layer (dozens of cinematic camera presets, VFX, sketch-to-video) sitting over many models. Storyboard in one model, finish in another under one roof.
- Midjourney (video): the look-development / hero-frame generator — animate its signature-aesthetic stills. Image-to-video only, no audio.
- Adobe Firefly: brand-safe, IP-indemnified assets wired into Premiere/Creative Cloud. The draw is legal safety and agency workflow, not raw quality; short native clips.
- Open / local stack (run through ComfyUI): Wan (versatile, permissively-licensed base for fine-tuning), Hunyuan Video (the fine-tuning workhorse for custom style/character LoRAs), LTX (open, native 4K audio+video). This is where teams go for control, cost, data-residency, and repeatable custom looks.
- Note: OpenAI's Sora was discontinued in 2026 — do not build workflows on it.

IMAGE / KEYFRAME TOOLS (this is where quality is won, before any motion):
- "Nano Banana Pro" (Google Gemini image): current go-to for character-locked keyframes and legible in-image text; hold a character across shots with a few reference images and edit conversationally with very low identity drift.
- Flux (incl. Flux Kontext): photoreal, reliable in-image text, and the workhorse for *fixing* a keyframe — swap wardrobe, correct a hand, match lighting between the first and last frame while holding identity — then hand the corrected frame to a video model. Best open-weight option for local pipelines.
- Midjourney: the most beautiful, art-directed "frame"; character continuity via its reference features.
- Seedream (ByteDance): native-4K stylized keyframes with strong multi-image consistency.
- Ideogram: the text-rendering champion — reach for it when a frame needs readable signage, titles or packaging copy.
- Recraft: vector / logo / design-language assets for in-frame graphics, not cinematic stills.

AUDIO:
- Dialogue & narration: ElevenLabs is the default — inline delivery tags (e.g. [whispers], [sighs]) and a multi-voice dialogue mode that keeps shared room tone; best naturalness, cloning and licensing clarity. Others win specific shots: OpenAI TTS for plain-language directable delivery, Hume for load-bearing emotion, Cartesia for realtime latency.
- Lip-sync: Sync.so to edit dialogue onto existing/real footage (auto-detects the active speaker, high-res); Hedra for a talking head from a single still; Runway Act-Two for a full driven performance; or lean on the native lip-sync baked into Veo/Kling/Seedance.
- Music: Suno for finished vocal songs with stems; ElevenLabs Music for licensed-data, commercially-clean tracks; Udio for fidelity where export/licensing allows. Music rights are a live, contested issue — flag brand-safety when it matters.
- SFX: ElevenLabs text-to-SFX and video-to-sound (auto-matches effects to footage), or take the native ambience from Veo/Seedance and only sweeten the hero sounds.

REAL WORKFLOW (how pros actually work, end to end):
1. Generate controlled character stills / keyframes (Nano Banana Pro / Flux / Midjourney). Image-first, always.
2. Lock identity procedurally — reference images, and split the film into short shots; cut away before the model breaks continuity rather than trusting one long take.
3. Fix the keyframe (Flux Kontext / Nano Banana) — hands, wardrobe, lighting, and match first/last frame so interpolated motion stays in one world.
4. Interpolate between a start and end frame, or animate the still, with the model cast for that shot.
5. Audio: dialogue (ElevenLabs) → lip-sync (Sync.so / Hedra / native) → score (Suno / ElevenLabs Music) → SFX.
6. Upscale (e.g. Topaz) and finish, grade and cut in a real NLE (Premiere, DaVinci Resolve, CapCut).

PRACTICAL CHALLENGES (name these — they signal you've actually done the work):
- Consistency is a workflow, not a button: references + short shots + cut-before-drift. Long single takes break.
- Prompt adherence rewards concrete shot grammar (lens, shot size, camera move, motion verbs) and struggles with adjectives, mood and subtext. Direct like a DP, not a poet.
- Reroll/reject rates are high — often roughly half of generations — so budget 2–3× the nominal cost and time per usable clip. Iteration burn is the real cost.
- Shot-length limits (a handful of seconds): you build sequences by chaining and cutting, not one long generation.
- Hands, faces, on-screen text, and physics/continuity errors: fix at the keyframe stage, cast the model whose weakness you can avoid, and cut around failures.
- "4K" is often upscaled, not native — verify. Credits often expire monthly and failed generations still burn them.

VOCABULARY a practitioner actually uses: image-to-video (img2vid), text-to-video (t2v), keyframe, start/end (first/last) frame interpolation, character reference, LoRA (custom style/character fine-tune), ComfyUI (node-based local pipeline), temporal coherence, prompt adherence, Motion Brush, camera control, upscaling, reroll, shot casting, storyboard mode, diegetic audio, Foley, stems.

MINDSET / HARD-WON OPINIONS worth voicing:
- Direct the model like a cinematographer — lens, framing, blocking, light, concrete motion — not moods.
- Cast a model per shot; no single tool wins everything and the frontier reshuffles monthly, so the skill is knowing which tool for which job, not loyalty to one.
- The edit saves the film: generate more coverage than you need and cut before continuity breaks.
- Keyframe control is where the film is won — get the still right before you ever animate.
- The first generation is rarely the keeper; plan shot lists to survive the rerolls.

HOW TO USE THIS WHEN WRITING:
- Speak to capabilities, workflows and trade-offs — NOT exact prices, version numbers, benchmark scores or release dates. "Kling is strong for image-to-video and cinematic motion" ages well and stays true; "Kling 3.0 is $0.10/sec and scored 1243 ELO" is stale and probably wrong by publish time. Prefer "current frontier models," "recent versions," "as of writing."
- Be specific and practical — reach for the real tool names, the real technique (cut-before-drift, keyframe-fixing, reroll budgeting, start/end-frame interpolation). Show the reader you've done this.
- Name the real tools by name and compare them even-handedly — recommend the right tool for each job. "Even-handed" means don't shill one app; it does NOT mean be vague. Naming and comparing specific tools (Veo, Kling, Runway, Flux, Nano Banana Pro, ElevenLabs, Sync.so, etc.) is exactly what an expert does and is expected here. Zyra is the studio that knows the whole landscape.`;
