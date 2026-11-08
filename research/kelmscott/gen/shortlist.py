import numpy as np, sys, string
from PIL import Image, ImageDraw, ImageFont
L = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz')
faces = [('Metamorphous-Regular.ttf', 'Metamorphous'), ('GoudyBookletter1911.ttf', 'Goudy Bookletter 1911'), ('Junicode-Bold.ttf', 'Junicode Bold'), ('Prociono-Regular.ttf', 'Prociono')]
T = 150; cs = 'ABCFHIKLMNOPSTVZ'
sh = Image.new('L', (len(cs) * (T + 6) + 200, (len(faces) + 1) * (T + 30) + 20), 255); d = ImageDraw.Draw(sh)
for i, c in enumerate(cs):
    m = L[c+'_let'] & ~L[c+'_ink']; im = Image.fromarray(np.where(m, 0, 255).astype(np.uint8)).resize((T * m.shape[1] // 700, T), Image.LANCZOS)
    sh.paste(im, (200 + i * (T + 6), 10))
d.text((5, 70), 'Morris (letter masks)', fill=0)
for j, (f, name) in enumerate(faces):
    fo = ImageFont.truetype('../kvfonts/' + f, 10); bb = fo.getbbox('H'); size = int(10 * T * .8 / (bb[3] - bb[1])); fo = ImageFont.truetype('../kvfonts/' + f, size)
    y = 10 + (j + 1) * (T + 30)
    d.text((5, y + 60), name, fill=0)
    for i, c in enumerate(cs): d.text((200 + i * (T + 6) + 10, y + T * .9), c, font=fo, fill=0, anchor='ls')
sh.save('out3/shortlist-vs-morris.png')
# full alphabets
sh = Image.new('L', (26 * 92 + 230, len(faces) * 130 + 20), 255); d = ImageDraw.Draw(sh)
for j, (f, name) in enumerate(faces):
    fo = ImageFont.truetype('../kvfonts/' + f, 10); bb = fo.getbbox('H'); fo = ImageFont.truetype('../kvfonts/' + f, int(10 * 90 / (bb[3] - bb[1])))
    d.text((5, j * 130 + 60), name, fill=0)
    for i, c in enumerate(string.ascii_uppercase): d.text((230 + i * 92, j * 130 + 110), c, font=fo, fill=0, anchor='ls')
sh.save('out3/shortlist-az.png')
