Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
public static class PlantFrames {
  public static void Cut(string source, string target, int[] centers, int top, int width, int height) {
    using (var input = new Bitmap(source))
    using (var output = new Bitmap(width * centers.Length, height, PixelFormat.Format32bppArgb)) {
      for (int f=0; f<centers.Length; f++) {
        int left=centers[f]-width/2;
        var colors=new Color[width*height];
        var clear=new bool[colors.Length];
        var queue=new Queue<int>();
        for(int y=0;y<height;y++) for(int x=0;x<width;x++) {
          int i=y*width+x;
          colors[i]=input.GetPixel(Math.Max(0,Math.Min(input.Width-1,left+x)),Math.Min(input.Height-1,top+y));
          if(x==0||x==width-1||y==0||y==height-1){clear[i]=true;queue.Enqueue(i);}
        }
        // Flood only the smooth background connected to the frame border.
        // Dark sprite outlines protect the green leaves from the color key.
        while(queue.Count>0){
          int i=queue.Dequeue(), x=i%width, y=i/width;
          int[] neighbors={x>0?i-1:-1,x<width-1?i+1:-1,y>0?i-width:-1,y<height-1?i+width:-1};
          foreach(int n in neighbors){
            if(n<0||clear[n])continue;
            var a=colors[i];var b=colors[n];
            int dr=a.R-b.R,dg=a.G-b.G,db=a.B-b.B;
            if(dr*dr+dg*dg+db*db<=49){clear[n]=true;queue.Enqueue(n);}
          }
        }
        for(int y=0;y<height;y++)for(int x=0;x<width;x++){
          int i=y*width+x;
          output.SetPixel(f*width+x,y,clear[i]?Color.Transparent:colors[i]);
        }
      }
      output.Save(target,ImageFormat.Png);
    }
  }
}
'@
$base = Join-Path $PSScriptRoot '../src/ambiente/xz'
[PlantFrames]::Cut((Join-Path $base 'mato.png'), (Join-Path $base 'mato-frames.png'), @(68,155,242,329), 25, 86, 96)
[PlantFrames]::Cut((Join-Path $base 'mato.png'), (Join-Path $base 'grama-frames.png'), @(449,536,623,710), 25, 86, 96)
[PlantFrames]::Cut((Join-Path $base 'floor.png'), (Join-Path $base 'flores-frames.png'), @(44,132,220,308), 16, 88, 88)
[PlantFrames]::Cut((Join-Path $base 'folhas.png'), (Join-Path $base 'folhas-frames.png'), @(47,137,227,317), 24, 90, 96)
