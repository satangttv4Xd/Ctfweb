import zipfile
import os
import random
import string
import shutil
import subprocess

def random_pass(length=8):
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def create_matryoshka():
    output_dir = "scratch/matryoshka_build"
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)

    num_layers = 20
    passwords = ["aq4cp79d"] + [random_pass() for _ in range(num_layers - 1)]

    final_flag = "flag{m4try0shk4_20_l4y3rs_z1p_cr4ck3d_succ3ssfu11y}"
    
    # Create innermost layer with 7z password
    layer20_dir = os.path.join(output_dir, "layer20_src")
    os.makedirs(layer20_dir, exist_ok=True)
    with open(os.path.join(layer20_dir, "flag.txt"), "w", encoding="utf-8") as f:
        f.write(f"Congratulations! Here is your flag:\n{final_flag}\n")

    current_file = os.path.abspath(os.path.join(output_dir, f"layer_{num_layers}.zip"))
    subprocess.run(["7z", "a", f"-p{passwords[-1]}", "-y", current_file, "*"], cwd=layer20_dir, check=True, stdout=subprocess.DEVNULL)

    for layer in range(num_layers - 1, 0, -1):
        prev_layer_file = current_file
        layer_src_dir = os.path.join(output_dir, f"layer_{layer}_src")
        os.makedirs(layer_src_dir, exist_ok=True)

        next_pass = passwords[layer] # Password for layer + 1
        this_pass = passwords[layer - 1] # Password to open current_file

        # Write note.txt with the password for the next layer
        with open(os.path.join(layer_src_dir, "note.txt"), "w", encoding="utf-8") as f:
            f.write(f"Password for next layer: {next_pass}\n")

        # Copy prev layer zip into this directory
        shutil.copy(prev_layer_file, os.path.join(layer_src_dir, os.path.basename(prev_layer_file)))

        current_file = os.path.abspath(os.path.join(output_dir, f"layer_{layer}.zip" if layer > 1 else "matryoshka.zip"))
        if os.path.exists(current_file):
            os.remove(current_file)
        subprocess.run(["7z", "a", f"-p{this_pass}", "-y", current_file, "*"], cwd=layer_src_dir, check=True, stdout=subprocess.DEVNULL)


    final_matryoshka = os.path.join("scratch", "matryoshka.zip")
    if os.path.exists(final_matryoshka):
        os.remove(final_matryoshka)
    shutil.copy(current_file, final_matryoshka)
    print(f"[+] Successfully generated 20-layer encrypted {final_matryoshka}")
    print(f"[+] Outermost password: {passwords[0]}")
    print(f"[+] Innermost flag: {final_flag}")
    print(f"[+] All passwords: {passwords}")

if __name__ == '__main__':
    create_matryoshka()

