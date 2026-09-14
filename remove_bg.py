from PIL import Image
import sys

def remove_black_bg(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    # threshold for "black"
    threshold = 30
    for item in datas:
        # item is (R, G, B, A)
        if item[0] < threshold and item[1] < threshold and item[2] < threshold:
            # Change all near-black pixels to transparent
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    remove_black_bg("anime_robot.png", "anime_robot_transparent.png")
