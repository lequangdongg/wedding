"""
Tạo nhạc nền TẠM (tự sáng tác, không bản quyền): hộp nhạc nhịp 3/4, vòng hoà âm I–V–vi–IV, ~32s lặp liền.
python3 scripts/musicbox.py  -> public/music/hop-nhac.mp3
Có bài hát thật (đã có quyền dùng) thì chép mp3 vào public/music/ và sửa media.music trong src/data/wedding.ts.
"""
import numpy as np, subprocess, os
SR = 44100
BPM = 84
beat = 60 / BPM
def note(f): return 440 * 2 ** ((f - 69) / 12)
def tone(freq, dur, amp=0.3):
    t = np.arange(int(SR * dur)) / SR
    env = np.exp(-t * 3.2) * (1 - np.exp(-t * 400))
    w = np.sin(2*np.pi*freq*t) + 0.35*np.sin(2*np.pi*2*freq*t) + 0.12*np.sin(2*np.pi*3.01*freq*t) + 0.05*np.sin(2*np.pi*4.2*freq*t)
    return amp * env * w
# C major: I C, V G, vi Am, IV F  (MIDI)
chords = [[48, 55, 64], [43, 50, 59], [45, 52, 60], [41, 48, 57]]
# giai điệu (mỗi ô nhịp 3 phách), 8 ô nhịp x 2 vòng
mel = [
  [76, 79, 84], [83, 79, 74], [76, 72, 69], [72, 77, 81],
  [79, 76, 72], [74, 79, 83], [81, 76, 72], [77, 74, 72],
]
bars = len(mel)
total = int(SR * beat * 3 * bars * 2) + SR * 2
out = np.zeros(total)
pos = 0.0
for rep in range(2):
    for b in range(bars):
        ch = chords[b % 4]
        start = int(pos * SR)
        bass = tone(note(ch[0]), beat * 3 + 1.5, 0.22)
        out[start:start + len(bass)] += bass
        for k in range(3):
            s = int((pos + k * beat) * SR)
            for n in ch[1:]:
                x = tone(note(n + 12), beat * 1.8, 0.07)
                out[s:s + len(x)] += x
            m = mel[b][k] + (12 if rep == 1 and k == 0 else 0)
            x = tone(note(m), beat * 2.2, 0.2 if rep == 0 else 0.17)
            out[s:s + len(x)] += x
        pos += beat * 3
# đuôi vòng lặp chồng lên đầu để lặp liền
loop_len = int(pos * SR)
tail = out[loop_len:]
out = out[:loop_len]; out[:len(tail)] += tail
# vang nhẹ
d = int(0.21 * SR); rev = np.copy(out)
for i, g in enumerate([0.32, 0.2, 0.12]):
    rev[d * (i + 1):] += out[:-d * (i + 1)] * g
rev /= np.max(np.abs(rev)) * 1.12
pcm = (rev * 32767).astype(np.int16).tobytes()
dst = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'music', 'hop-nhac.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-b:a', '96k', dst], input=pcm, check=True)
print(dst, os.path.getsize(dst) // 1024, 'KB', round(loop_len / SR, 1), 's')
