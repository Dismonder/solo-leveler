param(
  [string]$SourceRoot = "modele",
  [string]$OutDir = "src/assets/models/actors",
  [string]$FrameOutDir = "sprite-frames",
  [string]$PreviewDir = "sprite-previews",
  [int]$FrameSize = 384
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$processorSource = @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Text;

public static class SpriteManifestExtractor
{
    private struct Bounds
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
        public bool Empty;
        public int Width { get { return Empty ? 0 : Right - Left + 1; } }
        public int Height { get { return Empty ? 0 : Bottom - Top + 1; } }
    }

    private class ComponentInfo
    {
        public List<int> Pixels = new List<int>();
        public int Left = int.MaxValue;
        public int Top = int.MaxValue;
        public int Right = int.MinValue;
        public int Bottom = int.MinValue;
        public int Count { get { return Pixels.Count; } }
        public int Width { get { return Right - Left + 1; } }
        public int Height { get { return Bottom - Top + 1; } }
        public double CenterX { get { return (Left + Right) / 2.0; } }
        public double CenterY { get { return (Top + Bottom) / 2.0; } }
    }

    private class FrameExtraction
    {
        public Bounds Bounds;
        public HashSet<int> Pixels = new HashSet<int>();
        public string Status = "accepted";
        public string Reason = "";
        public int ComponentCount;
        public bool Empty { get { return Bounds.Empty || Pixels.Count == 0; } }
        public double CenterX { get { return Bounds.Empty ? 0 : (Bounds.Left + Bounds.Right) / 2.0; } }
        public double CenterY { get { return Bounds.Empty ? 0 : (Bounds.Top + Bounds.Bottom) / 2.0; } }
    }

    private static readonly List<string> Reports = new List<string>();

    public static void ClearReports()
    {
        Reports.Clear();
    }

    public static void SaveReports(string path)
    {
        var builder = new StringBuilder();
        builder.AppendLine("{");
        builder.AppendLine("  \"generatedAt\": \"" + DateTime.UtcNow.ToString("o") + "\",");
        builder.AppendLine("  \"sources\": [");
        for (var i = 0; i < Reports.Count; i++)
        {
            builder.Append(Reports[i]);
            builder.AppendLine(i == Reports.Count - 1 ? "" : ",");
        }
        builder.AppendLine("  ]");
        builder.AppendLine("}");
        File.WriteAllText(path, builder.ToString(), new UTF8Encoding(false));
    }

    public static void BuildActor(
        string sourcePath,
        string outDir,
        string frameOutDir,
        string previewDir,
        string actor,
        string mode,
        int columns,
        int rows,
        string[] animationNames,
        string[] cellCsvs,
        int frameSize,
        double scaleMultiplier,
        int bottomPadding,
        int minWidth,
        int minHeight)
    {
        Directory.CreateDirectory(outDir);
        Directory.CreateDirectory(frameOutDir);
        Directory.CreateDirectory(previewDir);

        if (!File.Exists(sourcePath))
        {
            Reports.Add(SourceReport(actor, sourcePath, mode, 0, 0, new List<string> {
                "    { \"animation\": \"source\", \"status\": \"missingSource\", \"requested\": 0, \"accepted\": 0, \"rejected\": 0, \"substituted\": 0 }"
            }));
            return;
        }

        var parsed = new List<int[]>();
        var maxIndex = 0;
        foreach (var csv in cellCsvs)
        {
            var cells = ParseCells(csv);
            parsed.Add(cells);
            foreach (var cell in cells) if (cell > maxIndex) maxIndex = cell;
        }
        var expectedPoses = maxIndex + 1;

        using (var source = new Bitmap(sourcePath))
        {
            var frames = mode == "grid"
                ? ExtractGridFrames(source, columns, rows, Math.Max(expectedPoses, columns * rows), minWidth, minHeight)
                : ExtractLoosePoses(source, expectedPoses, minWidth, minHeight);

            var usable = frames.Where(frame => frame.Status == "accepted" && !frame.Empty).ToList();
            if (usable.Count == 0)
            {
                Reports.Add(SourceReport(actor, sourcePath, mode, expectedPoses, frames.Count, new List<string> {
                    "    { \"animation\": \"all\", \"status\": \"failed\", \"requested\": " + expectedPoses + ", \"accepted\": 0, \"rejected\": " + expectedPoses + ", \"substituted\": 0 }"
                }));
                return;
            }

            var maxW = Math.Max(1, usable.Max(frame => frame.Bounds.Width));
            var maxH = Math.Max(1, usable.Max(frame => frame.Bounds.Height));
            var usableSize = frameSize * 0.86;
            var scale = Math.Min(usableSize / maxW, usableSize / maxH) * scaleMultiplier;
            scale = Math.Max(0.12, Math.Min(2.8, scale));
            var sourceStem = SanitizeFileName(Path.GetFileNameWithoutExtension(sourcePath));
            SaveFrameSequence(source, usable, Path.Combine(frameOutDir, "_poses", actor, sourceStem), frameSize, scale, bottomPadding);

            var animationReports = new List<string>();
            for (var i = 0; i < animationNames.Length; i++)
            {
                var animation = animationNames[i];
                var requestedCells = parsed[i];
                var selected = new List<FrameExtraction>();
                var rejected = 0;
                foreach (var cell in requestedCells)
                {
                    if (cell < 0 || cell >= frames.Count || frames[cell].Status != "accepted" || frames[cell].Empty)
                    {
                        rejected++;
                        continue;
                    }
                    selected.Add(frames[cell]);
                }
                int outlierRejected;
                selected = DropAnimationOutliers(selected, out outlierRejected);
                rejected += outlierRejected;

                var status = selected.Count == 0 ? "failed" : (rejected > 0 ? "substituted" : "accepted");
                if (selected.Count == 0)
                {
                    selected.Add(usable[0]);
                }

                var finalFrames = new List<FrameExtraction>();
                for (var frame = 0; frame < requestedCells.Length; frame++)
                {
                    finalFrames.Add(ResampleFrame(selected, frame, requestedCells.Length));
                }

                SaveStrip(source, finalFrames, Path.Combine(outDir, actor + "-" + animation + ".png"), frameSize, scale, bottomPadding);
                SaveFrameSequence(source, finalFrames, Path.Combine(frameOutDir, actor, animation), frameSize, scale, bottomPadding);
                SavePreview(Path.Combine(outDir, actor + "-" + animation + ".png"), Path.Combine(previewDir, actor + "-" + animation + "-preview.png"), frameSize, finalFrames.Count);

                animationReports.Add("    { \"animation\": \"" + Escape(animation) + "\", \"status\": \"" + status + "\", \"requested\": " + requestedCells.Length + ", \"accepted\": " + selected.Count + ", \"rejected\": " + rejected + ", \"substituted\": " + Math.Max(0, requestedCells.Length - selected.Count) + " }");
            }

            Reports.Add(SourceReport(actor, sourcePath, mode, expectedPoses, frames.Count, animationReports));
        }
    }

    private static FrameExtraction ResampleFrame(List<FrameExtraction> frames, int index, int targetCount)
    {
        if (frames.Count == 1 || targetCount <= 1) return frames[0];
        var sourceIndex = (int)Math.Round(index * (frames.Count - 1) / (double)(targetCount - 1));
        return frames[Math.Max(0, Math.Min(frames.Count - 1, sourceIndex))];
    }

    private static List<FrameExtraction> DropAnimationOutliers(List<FrameExtraction> frames, out int removed)
    {
        removed = 0;
        if (frames.Count < 3) return frames;

        var widths = frames.Select(frame => frame.Bounds.Width).OrderBy(value => value).ToList();
        var heights = frames.Select(frame => frame.Bounds.Height).OrderBy(value => value).ToList();
        var areas = frames.Select(frame => frame.Bounds.Width * frame.Bounds.Height).OrderBy(value => value).ToList();
        var medianW = widths[widths.Count / 2];
        var medianH = heights[heights.Count / 2];
        var medianArea = areas[areas.Count / 2];

        var filtered = frames
            .Where(frame =>
                frame.Bounds.Width >= Math.Max(10, medianW * 0.46) &&
                frame.Bounds.Height >= Math.Max(10, medianH * 0.46) &&
                frame.Bounds.Width * frame.Bounds.Height >= Math.Max(80, medianArea * 0.32))
            .ToList();

        if (filtered.Count < Math.Min(2, frames.Count))
        {
            return frames;
        }

        removed = frames.Count - filtered.Count;
        return filtered;
    }

    private static int[] ParseCells(string csv)
    {
        return csv.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(item => int.Parse(item.Trim()))
            .ToArray();
    }

    private static List<FrameExtraction> ExtractGridFrames(Bitmap source, int columns, int rows, int expected, int minWidth, int minHeight)
    {
        var frames = new List<FrameExtraction>();
        var count = Math.Min(expected, columns * rows);
        for (var i = 0; i < count; i++)
        {
            var rect = CellRect(source.Width, source.Height, columns, rows, i);
            frames.Add(ExtractFromBounds(source, BoundsFromRect(rect), minWidth, minHeight));
        }
        return frames;
    }

    private static List<FrameExtraction> ExtractLoosePoses(Bitmap source, int expectedPoses, int minWidth, int minHeight)
    {
        var full = new Bounds { Left = 0, Top = 0, Right = source.Width - 1, Bottom = source.Height - 1, Empty = false };
        var mask = BuildInitialMask(source, full);
        var components = BuildComponentsFromMask(mask, source.Width, source.Height, 18)
            .Where(component => component.Count >= 24)
            .ToList();

        if (components.Count == 0) return new List<FrameExtraction>();

        var largest = components.Max(component => component.Count);
        var relaxedMinW = Math.Max(8, (int)Math.Round(minWidth * 0.55));
        var relaxedMinH = Math.Max(8, (int)Math.Round(minHeight * 0.55));
        var primaries = components
            .Where(component =>
                component.Width >= relaxedMinW &&
                component.Height >= relaxedMinH &&
                component.Count >= Math.Max(42, largest * 0.012))
            .OrderByDescending(PrimaryScore)
            .ToList();

        if (primaries.Count == 0)
        {
            primaries = components.OrderByDescending(PrimaryScore).Take(Math.Max(expectedPoses, 1)).ToList();
        }

        var orderedPrimaries = SortByRows(primaries);
        var frameComponents = orderedPrimaries
            .Select(primary => new List<ComponentInfo> { primary })
            .ToList();

        foreach (var component in components)
        {
            if (orderedPrimaries.Any(primary => Object.ReferenceEquals(primary, component))) continue;
            if (component.Count < 14) continue;

            var bestIndex = -1;
            var bestDistance = double.MaxValue;
            for (var i = 0; i < orderedPrimaries.Count; i++)
            {
                var primary = orderedPrimaries[i];
                var distance = DistanceBetween(component, primary);
                var expanded = Expand(primary, Math.Max(primary.Width, primary.Height) * 0.28);
                var close = Intersects(component, expanded) || distance <= Math.Max(primary.Width, primary.Height) * 0.28;
                if (!close || distance >= bestDistance) continue;
                bestDistance = distance;
                bestIndex = i;
            }
            if (bestIndex >= 0)
            {
                var primary = orderedPrimaries[bestIndex];
                var tooTiny = component.Count < Math.Max(24, primary.Count * 0.008) &&
                    component.Width < primary.Width * 0.10 &&
                    component.Height < primary.Height * 0.10;
                var floatingLabel = component.Bottom < primary.Top + primary.Height * 0.08 &&
                    component.Count < primary.Count * 0.03;
                if (!tooTiny && !floatingLabel) frameComponents[bestIndex].Add(component);
            }
        }

        var frames = new List<FrameExtraction>();
        foreach (var group in frameComponents)
        {
            var frame = FrameFromComponents(source, group);
            QualityGate(frame, minWidth, minHeight, source.Width, source.Height);
            frames.Add(frame);
        }
        return frames;
    }

    private static double PrimaryScore(ComponentInfo component)
    {
        return component.Count + component.Width * component.Height * 0.08 + component.Height * 7.0;
    }

    private static List<ComponentInfo> SortByRows(List<ComponentInfo> components)
    {
        var sorted = components.OrderBy(component => component.CenterY).ToList();
        var rows = new List<List<ComponentInfo>>();
        var medianHeight = components.Select(component => component.Height).OrderBy(value => value).ElementAt(components.Count / 2);
        var tolerance = Math.Max(34, medianHeight * 0.42);

        foreach (var component in sorted)
        {
            var row = rows.FirstOrDefault(items => Math.Abs(items.Average(item => item.CenterY) - component.CenterY) <= tolerance);
            if (row == null)
            {
                row = new List<ComponentInfo>();
                rows.Add(row);
            }
            row.Add(component);
        }

        return rows
            .OrderBy(row => row.Average(component => component.CenterY))
            .SelectMany(row => row.OrderBy(component => component.CenterX))
            .ToList();
    }

    private static void QualityGate(FrameExtraction frame, int minWidth, int minHeight, int sourceWidth, int sourceHeight)
    {
        if (frame.Empty)
        {
            frame.Status = "rejected";
            frame.Reason = "empty";
            return;
        }
        if (frame.Bounds.Width < minWidth || frame.Bounds.Height < minHeight)
        {
            frame.Status = "rejected";
            frame.Reason = "tooSmall";
            return;
        }
        if (frame.Bounds.Left <= 1 || frame.Bounds.Top <= 1 || frame.Bounds.Right >= sourceWidth - 2 || frame.Bounds.Bottom >= sourceHeight - 2)
        {
            frame.Status = "rejected";
            frame.Reason = "touchesSourceEdge";
            return;
        }
        frame.Status = "accepted";
        frame.Reason = "";
    }

    private static FrameExtraction ExtractFromBounds(Bitmap source, Bounds bounds, int minWidth, int minHeight)
    {
        var mask = BuildInitialMask(source, bounds);
        var components = BuildComponentsFromMask(mask, bounds.Width, bounds.Height, 18)
            .OrderByDescending(PrimaryScore)
            .ToList();
        var primary = components.FirstOrDefault();
        if (primary == null) return new FrameExtraction { Bounds = bounds, Status = "rejected", Reason = "empty" };

        var selected = new List<ComponentInfo> { primary };
        foreach (var component in components.Skip(1))
        {
            var distance = DistanceBetween(component, primary);
            if (distance <= Math.Max(primary.Width, primary.Height) * 0.30 || Intersects(component, Expand(primary, Math.Max(primary.Width, primary.Height) * 0.26)))
            {
                selected.Add(component);
            }
        }

        var frame = FrameFromLocalComponents(source, bounds, selected);
        QualityGate(frame, minWidth, minHeight, source.Width, source.Height);
        return frame;
    }

    private static FrameExtraction FrameFromComponents(Bitmap source, List<ComponentInfo> components)
    {
        var frame = new FrameExtraction
        {
            Bounds = new Bounds { Left = source.Width, Top = source.Height, Right = 0, Bottom = 0, Empty = true },
            ComponentCount = components.Count
        };

        foreach (var component in components)
        {
            frame.Bounds.Empty = false;
            frame.Bounds.Left = Math.Min(frame.Bounds.Left, component.Left);
            frame.Bounds.Top = Math.Min(frame.Bounds.Top, component.Top);
            frame.Bounds.Right = Math.Max(frame.Bounds.Right, component.Right);
            frame.Bounds.Bottom = Math.Max(frame.Bounds.Bottom, component.Bottom);
            foreach (var index in component.Pixels) frame.Pixels.Add(index);
        }

        if (frame.Bounds.Empty) return frame;
        frame.Bounds.Left = Math.Max(0, frame.Bounds.Left - 3);
        frame.Bounds.Top = Math.Max(0, frame.Bounds.Top - 3);
        frame.Bounds.Right = Math.Min(source.Width - 1, frame.Bounds.Right + 3);
        frame.Bounds.Bottom = Math.Min(source.Height - 1, frame.Bounds.Bottom + 3);
        return frame;
    }

    private static FrameExtraction FrameFromLocalComponents(Bitmap source, Bounds sourceBounds, List<ComponentInfo> components)
    {
        var frame = new FrameExtraction
        {
            Bounds = new Bounds { Left = source.Width, Top = source.Height, Right = 0, Bottom = 0, Empty = true },
            ComponentCount = components.Count
        };

        foreach (var component in components)
        {
            frame.Bounds.Empty = false;
            var left = sourceBounds.Left + component.Left;
            var top = sourceBounds.Top + component.Top;
            var right = sourceBounds.Left + component.Right;
            var bottom = sourceBounds.Top + component.Bottom;
            frame.Bounds.Left = Math.Min(frame.Bounds.Left, left);
            frame.Bounds.Top = Math.Min(frame.Bounds.Top, top);
            frame.Bounds.Right = Math.Max(frame.Bounds.Right, right);
            frame.Bounds.Bottom = Math.Max(frame.Bounds.Bottom, bottom);
            foreach (var index in component.Pixels)
            {
                var localX = index % sourceBounds.Width;
                var localY = index / sourceBounds.Width;
                frame.Pixels.Add((sourceBounds.Top + localY) * source.Width + sourceBounds.Left + localX);
            }
        }

        if (frame.Bounds.Empty) return frame;
        frame.Bounds.Left = Math.Max(sourceBounds.Left, frame.Bounds.Left - 3);
        frame.Bounds.Top = Math.Max(sourceBounds.Top, frame.Bounds.Top - 3);
        frame.Bounds.Right = Math.Min(sourceBounds.Right, frame.Bounds.Right + 3);
        frame.Bounds.Bottom = Math.Min(sourceBounds.Bottom, frame.Bounds.Bottom + 3);
        return frame;
    }

    private static void SaveStrip(Bitmap source, List<FrameExtraction> frames, string path, int frameSize, double scale, int bottomPadding)
    {
        using (var strip = new Bitmap(frameSize * frames.Count, frameSize, PixelFormat.Format32bppArgb))
        using (var g = Graphics.FromImage(strip))
        {
            g.Clear(Color.Transparent);
            g.CompositingMode = CompositingMode.SourceOver;
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.SmoothingMode = SmoothingMode.HighQuality;

            for (var i = 0; i < frames.Count; i++)
            {
                DrawNormalizedFrame(g, source, frames[i], i * frameSize, frameSize, scale, bottomPadding);
            }
            SavePng(strip, path);
        }
    }

    private static void SaveFrameSequence(Bitmap source, List<FrameExtraction> frames, string dir, int frameSize, double scale, int bottomPadding)
    {
        if (Directory.Exists(dir)) Directory.Delete(dir, true);
        Directory.CreateDirectory(dir);
        var drawRects = BuildDrawRects(frames, frameSize, scale, bottomPadding);
        var maxCenterShift = MaxCenterShift(drawRects);
        var maxHeightShift = MaxHeightShift(drawRects);
        var warnings = new List<string>();
        if (maxCenterShift > frameSize * 0.18) warnings.Add("centerShift");
        if (maxHeightShift > frameSize * 0.18) warnings.Add("heightShift");

        var metadata = new StringBuilder();
        metadata.AppendLine("{");
        metadata.AppendLine("  \"frameSize\": " + frameSize + ",");
        metadata.AppendLine("  \"scale\": " + scale.ToString(System.Globalization.CultureInfo.InvariantCulture) + ",");
        metadata.AppendLine("  \"bottomPadding\": " + bottomPadding + ",");
        metadata.AppendLine("  \"quality\": { \"maxCenterShift\": " + maxCenterShift.ToString("0.###", System.Globalization.CultureInfo.InvariantCulture) + ", \"maxHeightShift\": " + maxHeightShift.ToString("0.###", System.Globalization.CultureInfo.InvariantCulture) + ", \"warnings\": [" + string.Join(", ", warnings.Select(warning => "\"" + Escape(warning) + "\"")) + "] },");
        metadata.AppendLine("  \"frames\": [");

        for (var i = 0; i < frames.Count; i++)
        {
            var draw = drawRects[i];
            var drawW = draw.Width;
            var drawH = draw.Height;
            var drawX = draw.X;
            var drawY = draw.Y;
            metadata.Append("    { \"index\": " + i + ", \"file\": \"" + i.ToString("000") + ".png\", \"sourceBounds\": { \"x\": " + frames[i].Bounds.Left + ", \"y\": " + frames[i].Bounds.Top + ", \"w\": " + frames[i].Bounds.Width + ", \"h\": " + frames[i].Bounds.Height + " }, \"draw\": { \"x\": " + drawX + ", \"y\": " + drawY + ", \"w\": " + drawW + ", \"h\": " + drawH + " }, \"components\": " + frames[i].ComponentCount + " }");
            metadata.AppendLine(i == frames.Count - 1 ? "" : ",");
            using (var frameBitmap = new Bitmap(frameSize, frameSize, PixelFormat.Format32bppArgb))
            using (var g = Graphics.FromImage(frameBitmap))
            {
                g.Clear(Color.Transparent);
                g.CompositingMode = CompositingMode.SourceOver;
                g.CompositingQuality = CompositingQuality.HighQuality;
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.SmoothingMode = SmoothingMode.HighQuality;
                DrawNormalizedFrame(g, source, frames[i], 0, frameSize, scale, bottomPadding);
                SavePng(frameBitmap, Path.Combine(dir, i.ToString("000") + ".png"));
            }
        }
        metadata.AppendLine("  ]");
        metadata.AppendLine("}");
        File.WriteAllText(Path.Combine(dir, "_metadata.json"), metadata.ToString(), new UTF8Encoding(false));
    }

    private static List<Rectangle> BuildDrawRects(List<FrameExtraction> frames, int frameSize, double scale, int bottomPadding)
    {
        var rects = new List<Rectangle>();
        foreach (var frame in frames)
        {
            var drawW = Math.Max(1, (int)Math.Round(frame.Bounds.Width * scale));
            var drawH = Math.Max(1, (int)Math.Round(frame.Bounds.Height * scale));
            var drawX = (frameSize - drawW) / 2;
            var drawY = frameSize - bottomPadding - drawH;
            rects.Add(new Rectangle(drawX, drawY, drawW, drawH));
        }
        return rects;
    }

    private static double MaxCenterShift(List<Rectangle> rects)
    {
        var max = 0.0;
        for (var i = 1; i < rects.Count; i++)
        {
            var previousX = rects[i - 1].Left + rects[i - 1].Width / 2.0;
            var previousY = rects[i - 1].Top + rects[i - 1].Height / 2.0;
            var currentX = rects[i].Left + rects[i].Width / 2.0;
            var currentY = rects[i].Top + rects[i].Height / 2.0;
            var dx = currentX - previousX;
            var dy = currentY - previousY;
            max = Math.Max(max, Math.Sqrt(dx * dx + dy * dy));
        }
        return max;
    }

    private static double MaxHeightShift(List<Rectangle> rects)
    {
        var max = 0.0;
        for (var i = 1; i < rects.Count; i++)
        {
            max = Math.Max(max, Math.Abs(rects[i].Height - rects[i - 1].Height));
        }
        return max;
    }

    private static void DrawNormalizedFrame(Graphics g, Bitmap source, FrameExtraction frame, int frameLeft, int frameSize, double scale, int bottomPadding)
    {
        using (var cleaned = CopyCleaned(source, frame))
        {
            var drawW = Math.Max(1, (int)Math.Round(cleaned.Width * scale));
            var drawH = Math.Max(1, (int)Math.Round(cleaned.Height * scale));
            var x = frameLeft + (frameSize - drawW) / 2;
            var y = frameSize - bottomPadding - drawH;
            g.DrawImage(cleaned, new Rectangle(x, y, drawW, drawH));
        }
    }

    private static Bitmap CopyCleaned(Bitmap source, FrameExtraction frame)
    {
        var bounds = frame.Bounds;
        var bitmap = new Bitmap(bounds.Width, bounds.Height, PixelFormat.Format32bppArgb);
        for (var y = 0; y < bounds.Height; y++)
        {
            for (var x = 0; x < bounds.Width; x++)
            {
                var absoluteX = bounds.Left + x;
                var absoluteY = bounds.Top + y;
                var index = absoluteY * source.Width + absoluteX;
                var color = source.GetPixel(absoluteX, absoluteY);
                bitmap.SetPixel(x, y, CleanPixel(color, frame.Pixels.Contains(index)));
            }
        }
        return bitmap;
    }

    private static bool[] BuildInitialMask(Bitmap source, Bounds bounds)
    {
        var width = bounds.Width;
        var height = bounds.Height;
        var total = width * height;
        var backgroundCandidate = new bool[total];
        var background = new bool[total];
        var mask = new bool[total];
        var queue = new Queue<int>();

        for (var y = 0; y < height; y++)
        {
            for (var x = 0; x < width; x++)
            {
                var color = source.GetPixel(bounds.Left + x, bounds.Top + y);
                backgroundCandidate[y * width + x] = IsBackgroundCandidate(color);
            }
        }

        Action<int> enqueue = index =>
        {
            if (index < 0 || index >= total || background[index] || !backgroundCandidate[index]) return;
            background[index] = true;
            queue.Enqueue(index);
        };

        for (var x = 0; x < width; x++)
        {
            enqueue(x);
            enqueue((height - 1) * width + x);
        }
        for (var y = 0; y < height; y++)
        {
            enqueue(y * width);
            enqueue(y * width + width - 1);
        }

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            var x = current % width;
            var y = current / width;
            for (var oy = -1; oy <= 1; oy++)
            {
                for (var ox = -1; ox <= 1; ox++)
                {
                    if (ox == 0 && oy == 0) continue;
                    var nx = x + ox;
                    var ny = y + oy;
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                    enqueue(ny * width + nx);
                }
            }
        }

        for (var y = 0; y < height; y++)
        {
            for (var x = 0; x < width; x++)
            {
                var index = y * width + x;
                if (background[index]) continue;
                var color = source.GetPixel(bounds.Left + x, bounds.Top + y);
                if (!IsHardBackground(color) && IsLikelyContent(color)) mask[index] = true;
            }
        }
        return mask;
    }

    private static List<ComponentInfo> BuildComponentsFromMask(bool[] mask, int width, int height, int minimumPixels)
    {
        var visited = new bool[width * height];
        var components = new List<ComponentInfo>();
        var queue = new Queue<int>();
        for (var i = 0; i < mask.Length; i++)
        {
            if (!mask[i] || visited[i]) continue;
            var component = new ComponentInfo();
            visited[i] = true;
            queue.Enqueue(i);
            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                component.Pixels.Add(current);
                var x = current % width;
                var y = current / width;
                component.Left = Math.Min(component.Left, x);
                component.Top = Math.Min(component.Top, y);
                component.Right = Math.Max(component.Right, x);
                component.Bottom = Math.Max(component.Bottom, y);
                for (var oy = -1; oy <= 1; oy++)
                {
                    for (var ox = -1; ox <= 1; ox++)
                    {
                        if (ox == 0 && oy == 0) continue;
                        var nx = x + ox;
                        var ny = y + oy;
                        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                        var next = ny * width + nx;
                        if (!mask[next] || visited[next]) continue;
                        visited[next] = true;
                        queue.Enqueue(next);
                    }
                }
            }
            if (component.Count >= minimumPixels) components.Add(component);
        }
        return components;
    }

    private static Rectangle CellRect(int width, int height, int columns, int rows, int index)
    {
        var col = index % columns;
        var row = index / columns;
        var left = (int)Math.Floor(col * width / (double)columns);
        var top = (int)Math.Floor(row * height / (double)rows);
        var right = (int)Math.Floor((col + 1) * width / (double)columns);
        var bottom = (int)Math.Floor((row + 1) * height / (double)rows);
        return Rectangle.FromLTRB(left, top, Math.Min(width, right), Math.Min(height, bottom));
    }

    private static Bounds BoundsFromRect(Rectangle rect)
    {
        return new Bounds { Left = rect.Left, Top = rect.Top, Right = rect.Right - 1, Bottom = rect.Bottom - 1, Empty = rect.Width <= 0 || rect.Height <= 0 };
    }

    private static Rectangle Expand(ComponentInfo component, double margin)
    {
        return Rectangle.FromLTRB(
            (int)Math.Floor(component.Left - margin),
            (int)Math.Floor(component.Top - margin),
            (int)Math.Ceiling(component.Right + margin),
            (int)Math.Ceiling(component.Bottom + margin));
    }

    private static bool Intersects(ComponentInfo component, Rectangle rect)
    {
        return component.Left < rect.Right &&
            component.Right >= rect.Left &&
            component.Top < rect.Bottom &&
            component.Bottom >= rect.Top;
    }

    private static double DistanceBetween(ComponentInfo a, ComponentInfo b)
    {
        var dx = 0;
        if (a.Right < b.Left) dx = b.Left - a.Right;
        else if (b.Right < a.Left) dx = a.Left - b.Right;
        var dy = 0;
        if (a.Bottom < b.Top) dy = b.Top - a.Bottom;
        else if (b.Bottom < a.Top) dy = a.Top - b.Bottom;
        return Math.Sqrt(dx * dx + dy * dy);
    }

    private static bool IsBackgroundCandidate(Color color)
    {
        if (color.A < 16) return true;
        var max = Math.Max(color.R, Math.Max(color.G, color.B));
        var min = Math.Min(color.R, Math.Min(color.G, color.B));
        var spread = max - min;
        var avg = (color.R + color.G + color.B) / 3;
        if (avg > 224 && spread < 52) return true;
        if (min > 202 && spread < 42) return true;
        return false;
    }

    private static bool IsHardBackground(Color color)
    {
        var max = Math.Max(color.R, Math.Max(color.G, color.B));
        var min = Math.Min(color.R, Math.Min(color.G, color.B));
        var spread = max - min;
        var avg = (color.R + color.G + color.B) / 3;
        return avg > 235 && spread < 54;
    }

    private static bool IsLikelyContent(Color color)
    {
        if (color.A < 16) return false;
        var max = Math.Max(color.R, Math.Max(color.G, color.B));
        var min = Math.Min(color.R, Math.Min(color.G, color.B));
        var spread = max - min;
        var avg = (color.R + color.G + color.B) / 3;
        if (avg < 226) return true;
        if (spread > 42 && (color.B > color.R + 10 || color.R > color.G + 16 || color.B > color.G + 16)) return true;
        return false;
    }

    private static Color CleanPixel(Color color, bool keep)
    {
        if (!keep || IsHardBackground(color)) return Color.Transparent;
        return Color.FromArgb(color.A, color.R, color.G, color.B);
    }

    private static void SavePreview(string stripPath, string previewPath, int frameSize, int frames)
    {
        using (var strip = new Bitmap(stripPath))
        using (var preview = new Bitmap(128 * frames, 128, PixelFormat.Format32bppArgb))
        using (var g = Graphics.FromImage(preview))
        {
            g.Clear(Color.FromArgb(24, 2, 6, 23));
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            for (var i = 0; i < frames; i++)
            {
                g.DrawImage(strip, new Rectangle(i * 128, 0, 128, 128), new Rectangle(i * frameSize, 0, frameSize, frameSize), GraphicsUnit.Pixel);
            }
            SavePng(preview, previewPath);
        }
    }

    private static void SavePng(Bitmap bitmap, string path)
    {
        var encoder = ImageCodecInfo.GetImageEncoders().First(codec => codec.FormatID == ImageFormat.Png.Guid);
        using (var parameters = new EncoderParameters(1))
        {
            parameters.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.ColorDepth, 32L);
            bitmap.Save(path, encoder, parameters);
        }
    }

    private static string SourceReport(string actor, string source, string mode, int expected, int detected, List<string> animationReports)
    {
        var builder = new StringBuilder();
        builder.AppendLine("  {");
        builder.AppendLine("    \"actor\": \"" + Escape(actor) + "\",");
        builder.AppendLine("    \"source\": \"" + Escape(source) + "\",");
        builder.AppendLine("    \"mode\": \"" + Escape(mode) + "\",");
        builder.AppendLine("    \"expectedPoses\": " + expected + ",");
        builder.AppendLine("    \"detectedPoses\": " + detected + ",");
        builder.AppendLine("    \"animations\": [");
        for (var i = 0; i < animationReports.Count; i++)
        {
            builder.Append(animationReports[i]);
            builder.AppendLine(i == animationReports.Count - 1 ? "" : ",");
        }
        builder.AppendLine("    ]");
        builder.Append("  }");
        return builder.ToString();
    }

    private static string Escape(string value)
    {
        return value.Replace("\\", "\\\\").Replace("\"", "\\\"");
    }

    private static string SanitizeFileName(string value)
    {
        foreach (var invalid in Path.GetInvalidFileNameChars())
        {
            value = value.Replace(invalid, '_');
        }
        return value;
    }
}
"@

Add-Type -TypeDefinition $processorSource -ReferencedAssemblies System.Drawing
[SpriteManifestExtractor]::ClearReports()

function Invoke-ActorBuild {
  param(
    [Parameter(Mandatory = $true)][string]$Actor,
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][hashtable]$Animations,
    [ValidateSet("loosePoses", "grid", "strip")][string]$Mode = "loosePoses",
    [int]$Columns = 1,
    [int]$Rows = 1,
    [double]$Scale = 1.0,
    [int]$BottomPadding = 14,
    [int]$MinWidth = 24,
    [int]$MinHeight = 36
  )

  $sourcePath = Join-Path $SourceRoot $Source
  $resolvedSource = $sourcePath
  if (Test-Path -LiteralPath $sourcePath) {
    $resolvedSource = (Resolve-Path -LiteralPath $sourcePath).Path
  } else {
    $sourceMatches = @(Get-ChildItem -Path $sourcePath -File -ErrorAction SilentlyContinue)
    if ($sourceMatches.Count -gt 0) {
      $resolvedSource = $sourceMatches[0].FullName
    }
  }
  $names = @($Animations.Keys)
  $cells = @($names | ForEach-Object { ($Animations[$_] -join ",") })

    [SpriteManifestExtractor]::BuildActor(
    $resolvedSource,
    (Join-Path (Get-Location) $OutDir),
    (Join-Path (Get-Location) $FrameOutDir),
    (Join-Path (Get-Location) $PreviewDir),
    $Actor,
    $Mode,
    $Columns,
    $Rows,
    [string[]]$names,
    [string[]]$cells,
    $FrameSize,
    $Scale,
    $BottomPadding,
    $MinWidth,
    $MinHeight
  )
  Write-Host "Processed $Actor from $Source"
}

$humanoid = [ordered]@{
  idle     = @(0, 1, 2, 3, 2, 1)
  run      = @(3, 4, 5, 6, 5, 4, 3)
  dash     = @(14, 15, 16, 17, 18, 19, 20)
  attack_1 = @(7, 8, 9, 10, 11, 12, 13)
  attack_2 = @(14, 15, 16, 17, 18, 19, 20)
  guard    = @(21, 22, 23, 24, 23, 22)
  cast     = @(21, 22, 23, 24, 25, 26, 27)
  hurt     = @(24, 25, 26, 27, 26, 25)
  death    = @(24, 25, 26, 27, 28, 29, 30)
}

Invoke-ActorBuild -Actor "hunter" -Source "modele_bohaterow/modele_bohater_3.png" -Mode "loosePoses" -Scale 0.94 -BottomPadding 10 -MinWidth 70 -MinHeight 120 -Animations ([ordered]@{
  run = @(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23)
})

Invoke-ActorBuild -Actor "hunter" -Source "modele_bohaterow/modele_bohater_4.png" -Mode "loosePoses" -Scale 0.94 -BottomPadding 10 -MinWidth 70 -MinHeight 120 -Animations ([ordered]@{
  idle     = @(20, 21, 22, 23, 22, 21)
  attack_1 = @(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)
  attack_2 = @(12, 13, 14, 15, 16, 17, 18, 19, 20)
  guard    = @(20, 21, 22, 23)
})

Invoke-ActorBuild -Actor "hunter" -Source "modele_bohaterow/modele_bohater_5.png" -Mode "loosePoses" -Scale 0.94 -BottomPadding 10 -MinWidth 70 -MinHeight 100 -Animations ([ordered]@{
  dash = @(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23)
  cast = @(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15)
})

Invoke-ActorBuild -Actor "hunter" -Source "modele_bohaterow/modele_bohater_6.png" -Mode "loosePoses" -Scale 0.94 -BottomPadding 10 -MinWidth 46 -MinHeight 64 -Animations ([ordered]@{
  hurt  = @(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)
  death = @(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23)
})

Invoke-ActorBuild -Actor "assassin" -Source "model_monster/model_animacja_goblin_zab*.png" -Mode "loosePoses" -Scale 0.98 -BottomPadding 14 -MinWidth 42 -MinHeight 72 -Animations $humanoid
Invoke-ActorBuild -Actor "goblin-archer" -Source "model_monster/model_animacja_goblin_lucznik.png" -Mode "loosePoses" -Scale 0.98 -BottomPadding 14 -MinWidth 42 -MinHeight 72 -Animations $humanoid
Invoke-ActorBuild -Actor "goblin-assassin" -Source "model_monster/model_animacja_goblin_zab*.png" -Mode "loosePoses" -Scale 0.98 -BottomPadding 14 -MinWidth 42 -MinHeight 72 -Animations $humanoid
Invoke-ActorBuild -Actor "skeleton-shield" -Source "model_monster/model_animacja_szkilet_ztarcza.png" -Mode "loosePoses" -Scale 0.98 -BottomPadding 14 -MinWidth 42 -MinHeight 72 -Animations $humanoid

Invoke-ActorBuild -Actor "wolf" -Source "model_monster/model_animacja_mlody_wilk.png" -Mode "loosePoses" -Scale 1.03 -BottomPadding 20 -MinWidth 58 -MinHeight 52 -Animations ([ordered]@{
  idle     = @(0, 1, 2, 3, 4, 5, 6)
  run      = @(7, 8, 9, 10, 11, 12, 13)
  dash     = @(14, 15, 16, 17, 18, 19, 20)
  attack_1 = @(21, 22, 23, 24, 25, 26, 27)
  attack_2 = @(28, 29, 30, 31, 32, 33, 34)
  guard    = @(21, 22, 23, 24, 25, 26, 27)
  cast     = @(35, 36, 37, 38, 39, 40, 41)
  hurt     = @(28, 29, 30, 31, 32, 33, 34)
  death    = @(29, 30, 31, 32, 33, 34, 35)
})

Invoke-ActorBuild -Actor "spider" -Source "model_monster/model_animacja_mlody_spider.png" -Mode "loosePoses" -Scale 1.04 -BottomPadding 20 -MinWidth 58 -MinHeight 42 -Animations ([ordered]@{
  idle     = @(0, 1, 2, 3, 4, 5, 6)
  run      = @(7, 8, 9, 10, 11, 12, 13)
  dash     = @(14, 15, 16, 17, 18, 19, 20)
  attack_1 = @(21, 22, 23, 24, 25, 26, 27)
  attack_2 = @(28, 29, 30, 31, 32, 33, 34)
  guard    = @(14, 15, 16, 17, 18, 19, 20)
  cast     = @(21, 22, 23, 24, 25, 26, 27)
  hurt     = @(28, 29, 30, 31, 32, 33, 34)
  death    = @(29, 30, 31, 32, 33, 34, 35)
})

Invoke-ActorBuild -Actor "slime-cursed" -Source "model_monster/model_animacja_slime_cursed.png" -Mode "loosePoses" -Scale 1.1 -BottomPadding 22 -MinWidth 46 -MinHeight 30 -Animations ([ordered]@{
  idle     = @(0, 1, 2, 3, 4, 5, 6)
  run      = @(7, 8, 9, 10, 11, 12, 13)
  dash     = @(14, 15, 16, 17, 18, 19, 20)
  attack_1 = @(21, 22, 23, 24, 25, 26, 27)
  attack_2 = @(28, 29, 30, 31, 32, 33, 34)
  guard    = @(28, 29, 30, 31, 32, 33, 34)
  cast     = @(21, 22, 23, 24, 25, 26, 27)
  hurt     = @(35, 36, 37, 38, 39, 40, 41)
  death    = @(42, 43, 44, 45, 46, 47, 48)
})

Invoke-ActorBuild -Actor "wraith" -Source "model_monster/model_animacja_slime_cursed.png" -Mode "loosePoses" -Scale 1.0 -BottomPadding 22 -MinWidth 46 -MinHeight 30 -Animations $humanoid
Invoke-ActorBuild -Actor "knight" -Source "model_monster/model_animacja_szkilet_ztarcza.png" -Mode "loosePoses" -Scale 0.96 -BottomPadding 14 -MinWidth 42 -MinHeight 72 -Animations $humanoid
Invoke-ActorBuild -Actor "golem" -Source "model_monster/model_animacja_szkilet_ztarcza.png" -Mode "loosePoses" -Scale 0.96 -BottomPadding 14 -MinWidth 42 -MinHeight 72 -Animations $humanoid

Invoke-ActorBuild -Actor "worm" -Source "model_monster/model_animacja_mlody_spider.png" -Mode "loosePoses" -Scale 0.88 -BottomPadding 20 -MinWidth 58 -MinHeight 42 -Animations ([ordered]@{
  idle     = @(0, 1, 2, 3, 4, 5, 6, 5)
  run      = @(7, 8, 9, 10, 11, 12, 13, 12, 11, 10)
  dash     = @(14, 15, 16, 17, 18)
  attack_1 = @(21, 22, 23, 24, 25, 26)
  attack_2 = @(28, 29, 30, 31, 32, 33, 34, 33, 32, 31)
  guard    = @(0, 1, 2, 3, 4, 5, 6, 5)
  cast     = @(21, 22, 23, 24, 25, 26)
  hurt     = @(28, 29, 30, 31, 32, 33)
  death    = @(29, 30, 31, 32, 33, 34, 35)
})

[SpriteManifestExtractor]::SaveReports((Join-Path (Get-Location) (Join-Path $PreviewDir "_qa-report.json")))

function Write-SpritePreviewIndex {
  param(
    [Parameter(Mandatory = $true)][string]$FramesRoot,
    [Parameter(Mandatory = $true)][string]$PreviewsRoot
  )

  $animations = @()
  Get-ChildItem -Path $FramesRoot -Directory | Where-Object { $_.Name -ne "_poses" } | Sort-Object Name | ForEach-Object {
    $actorDir = $_
    Get-ChildItem -Path $actorDir.FullName -Directory | Sort-Object Name | ForEach-Object {
      $animationDir = $_
      $frames = @(Get-ChildItem -Path $animationDir.FullName -Filter "*.png" -File | Sort-Object Name)
      if ($frames.Count -eq 0) { return }
      $relativeFramePath = "../" + ($animationDir.FullName.Substring((Get-Location).Path.Length + 1).Replace("\", "/"))
      $previewName = "$($actorDir.Name)-$($animationDir.Name)-preview.png"
      $animations += [pscustomobject]@{
        actor = $actorDir.Name
        animation = $animationDir.Name
        frames = $frames.Count
        framePath = $relativeFramePath
        preview = $previewName
      }
    }
  }

  $payload = ($animations | ConvertTo-Json -Depth 4)
  $html = @'
<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sprite QA Player</title>
  <style>
    :root { color-scheme: dark; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; background: #030712; color: #dbeafe; }
    body { margin: 0; padding: 24px; background: radial-gradient(circle at 20% 0%, rgba(14, 165, 233, .18), transparent 34%), #030712; }
    h1 { margin: 0 0 8px; letter-spacing: .16em; text-transform: uppercase; font-size: 22px; }
    .lead { margin: 0 0 22px; color: #94a3b8; max-width: 960px; line-height: 1.55; }
    .toolbar { position: sticky; top: 0; z-index: 4; display: flex; gap: 12px; flex-wrap: wrap; padding: 12px; margin: 0 0 18px; background: rgba(3, 7, 18, .86); border: 1px solid rgba(34, 211, 238, .22); backdrop-filter: blur(12px); }
    input, select, button { background: #06111f; color: #dbeafe; border: 1px solid rgba(34, 211, 238, .36); padding: 9px 11px; font: inherit; }
    button { cursor: pointer; color: #67e8f9; text-transform: uppercase; letter-spacing: .12em; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 16px; }
    .card { border: 1px solid rgba(59, 130, 246, .38); background: linear-gradient(135deg, rgba(15, 23, 42, .96), rgba(2, 6, 23, .96)); box-shadow: 0 0 24px rgba(14, 165, 233, .12); padding: 14px; }
    .title { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; margin-bottom: 10px; }
    .title strong { color: #f8fafc; letter-spacing: .12em; text-transform: uppercase; }
    .title span { color: #22d3ee; font-size: 12px; }
    .stage { height: 190px; display: grid; place-items: center; background: linear-gradient(transparent 95%, rgba(34, 211, 238, .08) 95%), linear-gradient(90deg, transparent 95%, rgba(34, 211, 238, .08) 95%), #020617; background-size: 18px 18px; border: 1px solid rgba(59, 130, 246, .22); overflow: hidden; }
    .stage img { width: 160px; height: 160px; object-fit: contain; image-rendering: auto; filter: drop-shadow(0 0 12px rgba(34, 211, 238, .4)); }
    .strip { width: 100%; height: 78px; object-fit: contain; object-position: left center; background: #020617; border: 1px solid rgba(148, 163, 184, .14); margin-top: 10px; }
    .meta { display: flex; justify-content: space-between; margin-top: 10px; color: #94a3b8; font-size: 12px; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <h1>Sprite QA Player</h1>
  <p class="lead">Ten podglad odtwarza pojedyncze klatki z <code>sprite-frames</code>, a nie skompresowany GIF. Dzieki temu widac prawdziwy crop, kotwice bottom-center i ewentualne skoki klatek bez utraty przezroczystosci.</p>
  <div class="toolbar">
    <input id="filter" placeholder="Filtr: hunter, wolf, attack..." />
    <select id="speed">
      <option value="90">Szybko</option>
      <option value="130" selected>Normalnie</option>
      <option value="190">Wolno</option>
    </select>
    <button id="toggle">Pauza</button>
  </div>
  <div id="grid" class="grid"></div>
  <script>
    const animations = __ANIMATIONS_JSON__;
    const grid = document.getElementById("grid");
    const filter = document.getElementById("filter");
    const speed = document.getElementById("speed");
    const toggle = document.getElementById("toggle");
    let paused = false;
    let frame = 0;

    function frameUrl(item, index) {
      return item.framePath + "/" + String(index).padStart(3, "0") + ".png";
    }

    function render() {
      grid.innerHTML = "";
      for (const item of animations) {
        const search = (item.actor + " " + item.animation).toLowerCase();
        const card = document.createElement("article");
        card.className = "card" + (filter.value && !search.includes(filter.value.toLowerCase()) ? " hidden" : "");
        card.dataset.frames = item.frames;
        card.innerHTML = `
          <div class="title"><strong>${item.actor}</strong><span>${item.animation} - ${item.frames}f</span></div>
          <div class="stage"><img src="${frameUrl(item, 0)}" alt=""></div>
          <img class="strip" src="${item.preview}" alt="">
          <div class="meta"><span>${item.framePath}</span><span>384x384</span></div>
        `;
        grid.appendChild(card);
      }
    }

    function tick() {
      if (!paused) {
        frame++;
        for (const card of grid.querySelectorAll(".card:not(.hidden)")) {
          const title = card.querySelector(".title strong").textContent;
          const anim = card.querySelector(".title span").textContent.split(" - ")[0];
          const item = animations.find(entry => entry.actor === title && entry.animation === anim);
          const img = card.querySelector(".stage img");
          img.src = frameUrl(item, frame % item.frames);
        }
      }
      setTimeout(tick, Number(speed.value));
    }

    filter.addEventListener("input", render);
    toggle.addEventListener("click", () => {
      paused = !paused;
      toggle.textContent = paused ? "Start" : "Pauza";
    });
    render();
    tick();
  </script>
</body>
</html>
'@

  $html = $html.Replace("__ANIMATIONS_JSON__", $payload)

  Set-Content -LiteralPath (Join-Path $PreviewsRoot "index.html") -Value $html -Encoding UTF8
}

Write-SpritePreviewIndex -FramesRoot (Join-Path (Get-Location) $FrameOutDir) -PreviewsRoot (Join-Path (Get-Location) $PreviewDir)
Write-Host "Sprite extraction complete. Runtime sheets: $OutDir. Debug previews and QA report: $PreviewDir."
