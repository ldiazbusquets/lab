"""Export torchvision's LR-ASPP MobileNetV3-Large segmentation model (BSD-3-Clause, trained on the 20 Pascal VOC
classes) to ONNX for the thermal view. The wrapper normalises the image itself and returns three soft maps: people,
vehicles and animals (probabilities 0..1), so the page only feeds RGB in 0..1 and reads the masks back."""
import torch, torchvision

VEH = [1, 2, 4, 6, 7, 14, 19]      # aeroplane, bicycle, boat, bus, car, motorbike, train
ANI = [3, 8, 10, 12, 13, 17]       # bird, cat, cow, dog, horse, sheep
PERSON = 15


class Heat(torch.nn.Module):
    def __init__(self, m):
        super().__init__()
        self.m = m
        self.register_buffer('mean', torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1))
        self.register_buffer('std', torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1))

    def forward(self, x):
        p = torch.softmax(self.m((x - self.mean) / self.std)['out'], dim=1)
        return torch.cat([p[:, PERSON:PERSON + 1], p[:, VEH].sum(1, keepdim=True), p[:, ANI].sum(1, keepdim=True)], 1)


m = torchvision.models.segmentation.lraspp_mobilenet_v3_large(weights='DEFAULT').eval()
net = Heat(m).eval()
x = torch.rand(1, 3, 288, 512)
torch.onnx.export(net, x, 'models/seg.onnx', input_names=['image'], output_names=['heat'], opset_version=17,
                  dynamic_axes={'image': {2: 'h', 3: 'w'}, 'heat': {2: 'h', 3: 'w'}}, do_constant_folding=True)
import onnxruntime as ort, numpy as np
s = ort.InferenceSession('models/seg.onnx')
y = s.run(None, {'image': x.numpy()})[0]
ref = net(x).detach().numpy()
print('shape', y.shape, 'max diff', float(np.abs(y - ref).max()))
