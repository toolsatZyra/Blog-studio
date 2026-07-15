// AI Filmmaking Playbook — the grounded, practitioner-level knowledge the blog
// writer draws on so posts read like they were written by someone who actually
// makes AI films, not a generalist.
//
// DELIBERATELY CAPABILITY-FIRST, NOT SPEC-FIRST. This field ships new model
// versions monthly and prices/benchmarks/version numbers are already
// contradictory across sources — baking them in would date every post and risk
// being wrong. So this captures what tools are *best at*, the real workflows,
// the practical challenges, and the vocabulary — the parts that age well.
// Compiled from current (mid-July 2026) practitioner research; refresh periodically.

export const AI_FILM_KNOWLEDGE = `AI FILMMAKING PLAYBOOK (practitioner knowledge — write from this):

THE CORE TRUTH OF THE CRAFT: Nobody serious ships a single text-to-video prompt. Real work is a multi-tool "workflow stack": lock a character in stills → animate short shots → add or capture audio → upscale/grade/finish. You cast a different model for each shot the way a director casts for a role, and increasingly a different model per SCENE within one film. Image-to-video — animating a controlled still — is the backbone, not text-to-video.

VIDEO MODELS — what each is genuinely best at (name them freely and honestly):
- Google Veo: the safest all-rounder, and still the reference for native synchronized audio — it generates dialogue, ambience and SFX locked to the picture in one pass, with the strongest lip-synced spoken dialogue of any model. Reach for it on realistic hero shots, dialogue scenes, and any shot where audio-visual sync sells the realism. Less directable shot-by-shot than Runway; not its strength for stylized/animated looks.
- Kling: leads image-to-video motion and cinematic physics (cloth, fluids, light interaction) and holds identity and scene coherence across some of the longest usable windows. Motion Control lets you copy motion from a reference video, motion-brush specific regions, and set first/last frames. Now does single-pass synced audio, and its "Omni" tier does per-character lip-sync — two speakers in one shot, each mouth synced to its own track. Prompt literalness can wander on complex multi-subject scenes.
- Runway: the director's tool — reach for it when you want to CONTROL the shot, not hope the model lands it. Its standout is Act-Two performance capture: drive a character's face, hands AND full body from your own acted reference video (the older Act-One was face-only). Strong on subtle facial performance and weighty physics; positioned now as an end-to-end production platform, not one model.
- Seedance (ByteDance): risen sharply to top tier and the biggest riser to know. Best for story-led, multi-shot, branded-character and commercial work — it takes multiple reference images, video and audio clips in one pass with role-tagging (e.g. "this image is the main character") to lock identity, and generates the longest native single takes, which cuts down stitching. Strong multi-participant and sports motion.
- Luma Ray: differentiated on studio-grade output (native HDR with EXR export, color-grade-ready) and frame-level directing — place multiple keyframes inside one clip for precise pacing, plus start-frame to end-frame interpolation and strong video-to-video restyle ("Modify"). Best when you need gradeable output and tight motion authoring.
- MiniMax Hailuo: the value-tier physics and instruction-following specialist — convincing hard physical motion (gymnastics, fluids, fire/smoke), reliable response to real cinematographic camera language, stable across short clips. Cheap iteration.
- Pika: fast, social-first short-form — text/image/clip in, polished short clip out in seconds. A short-form effects engine, not narrative cinema.
- Midjourney (video): animates Midjourney's signature-aesthetic stills into short clips. A look/style tool for creators already in that image ecosystem, not a production workhorse.
- Adobe Firefly: has repositioned as a commercially-safe, IP-indemnified multi-model studio/aggregator — it hosts partner models (Runway, Veo, Luma, Pika, image models) inside a timeline editor with 4K/HDR. The draw is enterprise/brand legal safety inside Creative Cloud, not a single competitive model.
- Open / local stack (run through ComfyUI): Wan (Alibaba) is the go-to permissively-licensed base for fine-tuning a character or style — one model for text-to-video, image-to-video and editing, and it now adds first/last-frame control and multi-image input (this is where first/last-frame matching lives in the open stack). HunyuanVideo (Tencent) has the most cinematic aesthetic and the most mature LoRA/fine-tune ecosystem. LTX (Lightricks) is the open model that generates synchronized audio AND video in a single pass locally, with the richest adapter ecosystem and quantized builds for consumer GPUs. This tier is where teams go for control, cost, data-residency, and repeatable custom characters.
- Note: OpenAI's Sora is being discontinued (consumer app gone, API sunsetting, no successor) and never generated native synced audio anyway — do not build workflows on it.

IMAGE / KEYFRAME TOOLS (this is where quality is won, before any motion). The big shift: a locked REFERENCE IMAGE at frame zero is now the default identity method — you only train a LoRA when a character recurs dozens of times or needs extreme pose/lighting range.
- Google's Gemini image model, the "Nano Banana" line, is the current go-to for character-locked keyframes and legible in-image text: it ingests many reference images at once and can hold several distinct people's likeness in one frame. Treat it as a tiered line, not one model — the Pro tier is the maximum-fidelity ceiling (complex composition, fine typography), and the newer faster Flash-tier "Nano Banana 2" is the everyday default most creators actually reach for (near-Pro quality, much faster).
- Flux (Black Forest Labs), current Flux 2 / Flux 2 Kontext generation, is the workhorse for reference-heavy consistency and the reference name for context-aware, instruction-driven edits — swap wardrobe, fix a hand, relight, match first and last frame while holding identity. Photorealism, skin texture and lighting are its strengths, and it now understands references well enough to need far less LoRA training than before. Best open-weight base for local pipelines.
- Seedream (ByteDance) has become a genuine top-tier character-consistency option — photoreal, cinematic lighting, complex spatial relationships, high-res, many reference images.
- Midjourney: the most art-directed, aesthetically distinctive frame; the pick for style-driven recurring characters rather than surgical control.
- Qwen Image Edit (Alibaba, open-weight): the standout for mask-based, pixel-precise fixes — object removal, wardrobe/hand repair, region-locked edits with layout and text preserved. The open counterpart to Flux Kontext for surgical local control.
- Ideogram / Recraft: niche-but-useful — Ideogram for legible in-frame text and signage, Recraft for vector/logo/brand-graphic assets. Not the character-lock leaders.

AUDIO:
- Dialogue & narration: ElevenLabs is the default and quality leader — inline delivery tags (e.g. [whispers], [sighs], [laughs]) for directed emotion, native multi-speaker dialogue in one generation, broad language coverage and clean cloning/licensing. Rivals win specific axes: Fish Audio for hands-on emotion/style control, Resemble for character-voice range, PlayHT for the widest languages, Descript Overdub for quick fix-ups inside an edit.
- Lip-sync — keep the distinctions straight:
  - Talking head from a single still: Hedra (Character-3) is best-in-class — phoneme-level mouth shapes, blinks, micro-expressions from one portrait.
  - Drive a character from a real performance: Runway Act-Two transfers face, hands and full body from your acted reference video — use it when you want an actor's actual choices, not model-invented motion.
  - Sync new audio onto existing/real footage (dubbing, translation): Sync.so (purpose-built, strong pipeline/API) and Magic Hour.
  - Native lip-sync inside the video model: increasingly standard — Veo generates synced multilingual dialogue, and Kling's Omni tier syncs two speakers per shot. For many talking-character shots a standalone lip-sync tool is no longer mandatory.
- Music: Suno and Udio are the quality/expressiveness leaders, but music rights are a live, contested issue — Udio has signed label licensing deals while Suno remains in active litigation with some majors, so verify current commercial terms before brand use. For clean commercial safety, ElevenLabs Music and Stable Audio are trained on licensed data and carry commercial rights up front — the low-legal-risk picks for client work even if Suno/Udio sound punchier.
- SFX: ElevenLabs is the quality leader for text-to-SFX (natural-language prompts, seamless loops, broadcast-grade), and its Video-to-Sound tool auto-analyzes a clip and places matching effects (engine roar, tire screech, impacts) without manual spotting. Or take the native ambience from Veo/Seedance and only sweeten the hero sounds.

REAL WORKFLOW (how pros actually work, end to end):
1. Generate a controlled character sheet / keyframes first (Nano Banana line, Flux 2, Seedream, Midjourney) — front, side, three-quarter, with scars/accessories/wardrobe made explicit. Image-first, always. The character sheet is the single highest-leverage asset and now REPLACES LoRA fine-tuning for most creators.
2. Lock identity by reference, not by hope — a locked reference at frame zero, multi-image role-tagging (Seedance), or performance capture (Runway Act-Two). Escalate to a trained character LoRA only for a character that recurs across a whole season or needs extreme variation.
3. Fix the keyframe before animating (Flux 2 Kontext, Nano Banana, or Qwen Image Edit for mask-precise repair) — hands, wardrobe, lighting, and match first/last frame so interpolated motion stays in one world.
4. Interpolate between a start and end frame (and multiple mid-keyframes), or animate the still, with the model cast for that shot.
5. Audio: dialogue (ElevenLabs) → lip-sync (native in Veo/Kling, or Sync.so / Hedra / Act-Two) → score (Suno / ElevenLabs Music) → SFX (ElevenLabs Video-to-Sound).
6. Upscale, grade and cut in a real NLE (DaVinci Resolve, Premiere) — where continuity across shots gets its last human check.

PRACTICAL CHALLENGES (name these — they signal you've actually done the work):
- Consistency over duration is still problem #1: identity, wardrobe and lighting drift across shots, and even the best models show visible degradation past roughly 20-25 seconds of continuous generation. Solve it with references + short shots + cut-before-drift, not one long take.
- Hands, close physical contact (gripping, handshakes, crowded blocking) and on-screen text (signs, labels) still break — text often renders garbled. Fix at the keyframe stage, cast the model whose weakness you can avoid, and cut around failures.
- Physics artifacts in water, cloth and complex object interaction still read as fake without physics-aware models.
- Prompt adherence vs stability tradeoff: the frontier increasingly holds the look at the expense of literal instruction-following, so direct with concrete shot grammar and expect to reroll for exact compliance.
- Reroll/reject rates stay high — budget 2-3x the nominal cost and time per usable clip, but control it: reroll a good shot with small edits that keep its motion structure rather than regenerating from scratch, or costs balloon.
- "4K" is often upscaled, not native — verify.

VOCABULARY a practitioner actually uses: image-to-video (img2vid), text-to-video (t2v), character sheet, keyframe, start/end (first/last) frame interpolation, reference image, role-tagging, performance capture, LoRA (custom style/character fine-tune), ComfyUI (node-based local pipeline), IC-LoRA, temporal coherence, prompt adherence, Motion Control / Motion Brush, upscaling, reroll, shot casting, model-per-scene, diegetic audio, Foley, stems.

MINDSET / HARD-WON OPINIONS worth voicing:
- Direct the model like a cinematographer — lens, framing, blocking, light, concrete motion — not moods.
- Cast a model per shot, even per scene; no single tool wins everything and the frontier reshuffles monthly, so the skill is knowing which tool for which job, not loyalty to one.
- The edit saves the film: generate more coverage than you need and cut before continuity breaks.
- The character sheet is where the film is won — get the reference right before you ever animate.
- The first generation is rarely the keeper; plan shot lists to survive the rerolls.

HOW TO USE THIS WHEN WRITING:
- Speak to capabilities, workflows and trade-offs — NOT exact prices, version numbers, benchmark scores or release dates. "Kling is strong for image-to-video and cinematic motion" ages well; "Kling 3.0 is $0.10/sec and scored 1243 ELO" is stale and probably wrong by publish time. Prefer "current frontier models," "recent versions," "as of writing."
- Be specific and practical — reach for the real tool names, the real technique (character sheet, role-tagging, cut-before-drift, keyframe-fixing, reroll budgeting, start/end-frame interpolation). Show the reader you've done this.
- Stay tool-neutral and honest: recommend the right tool for the job; Zyra is the studio that knows the whole landscape, not a reseller of one app.`;
