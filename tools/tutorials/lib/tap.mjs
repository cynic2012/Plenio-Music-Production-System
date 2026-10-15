// The sound the page plays, for the edit: the score editor's playback (the notes in the tracks' sounds,
// the source recording of a cover, both - A/B), a sound's preview, the keys of a MIDI keyboard. The
// recording itself has no sound (the screencast is pictures only), so everything a page connects to an
// AudioContext's destination is also sent to a recorder of its own - one per context, started with the
// context, its start time on the page's clock. studio.mjs collects the recordings at the end.

export const TAP = `(() => {
  if (window.__tutTap) return
  const tap = (window.__tutTap = { recorders: [] })
  const connect = AudioNode.prototype.connect
  const taps = new WeakMap()
  const recorderFor = (context) => {
    let entry = taps.get(context)
    if (entry) return entry
    const destination = context.createMediaStreamDestination()
    const types = ['audio/webm;codecs=opus', 'audio/webm']
    const mimeType = types.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || ''
    const recorder = new MediaRecorder(destination.stream, { mimeType, audioBitsPerSecond: 256000 })
    entry = { destination, recorder, chunks: [], started: Date.now() }
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) entry.chunks.push(e.data) }
    recorder.start(1000)
    taps.set(context, entry)
    tap.recorders.push(entry)
    return entry
  }
  AudioNode.prototype.connect = function (target, ...rest) {
    const result = connect.call(this, target, ...rest)
    if (target instanceof AudioDestinationNode) {
      try { connect.call(this, recorderFor(target.context).destination) } catch (e) { console.warn('tutorial audio tap:', e) }
    }
    return result
  }
  // every recording so far, as base64 with its start time (Date.now() of the page)
  tap.collect = async () => {
    const out = []
    for (const entry of tap.recorders) {
      if (entry.recorder.state !== 'inactive') {
        await new Promise((resolve) => { entry.recorder.onstop = resolve; entry.recorder.stop() })
      }
      const blob = new Blob(entry.chunks, { type: entry.recorder.mimeType || 'audio/webm' })
      const bytes = new Uint8Array(await blob.arrayBuffer())
      let binary = ''
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
      out.push({ started: entry.started, type: blob.type, data: btoa(binary) })
    }
    return out
  }
})()`
