from PIL import Image

img = Image.open('right.png')
img = img.resize((25,25))
img.save('right_2.png')