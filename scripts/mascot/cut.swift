// usage: cut <in.png> <x> <y> <w> <h> <out.png> [mask=1|0]
import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins
import ImageIO
import UniformTypeIdentifiers

let a = CommandLine.arguments
let url = URL(fileURLWithPath: a[1])
let x = Double(a[2])!, y = Double(a[3])!, w = Double(a[4])!, h = Double(a[5])!
let out = URL(fileURLWithPath: a[6])
let doMask = a.count < 8 || a[7] == "1"
let src = CIImage(contentsOf: url)!
let H = src.extent.height
// CI origin is bottom-left
let crop = src.cropped(to: CGRect(x: x, y: H - y - h, width: w, height: h))
    .transformed(by: CGAffineTransform(translationX: -x, y: -(H - y - h)))
let ctx = CIContext()
var result = crop
if doMask {
  let cg = ctx.createCGImage(crop, from: crop.extent)!
  let req = VNGenerateForegroundInstanceMaskRequest()
  let handler = VNImageRequestHandler(cgImage: cg)
  try! handler.perform([req])
  guard let obs = req.results?.first else { print("no subject"); exit(1) }
  let buf = try! obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler)
  let mask = CIImage(cvPixelBuffer: buf)
  let f = CIFilter.blendWithMask()
  f.inputImage = crop
  f.backgroundImage = CIImage.empty()
  f.maskImage = mask
  result = f.outputImage!.cropped(to: crop.extent)
  print("instances", obs.allInstances.count)
}
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
try! ctx.writePNGRepresentation(of: result, to: out, format: .RGBA8, colorSpace: cs)
