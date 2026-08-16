{
  pkgs ? import <nixpkgs> { },
}:

with pkgs;
mkShell {
  name = "tree-sitter-highlight";
  buildInputs = [
    rustc
    cargo

    # how lx find lua
    pkg-config
    lux-cli
    (lua5_1.withPackages (
      p: with p; [
        busted
        ldoc
      ]
    ))

    uv
    maturin
    (python3.withPackages (
      p: with p; [
        tree-sitter-python
      ]
    ))
  ];
}
