import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_drawing/path_drawing.dart';
import 'catalogue.dart';
import 'component.dart';

double _n(dynamic value) => (value as num).toDouble();

/// A scrollable, zoomable composition of the source Figma page.
/// [page] is the same collection name used by KitCatalogue (e.g. 'Toggles').
class KitFigmaPage extends StatefulWidget {
  final String page;
  final Brightness? brightness;
  const KitFigmaPage({super.key, required this.page, this.brightness});
  @override
  State<KitFigmaPage> createState() => _KitFigmaPageState();
}

class _KitFigmaPageState extends State<KitFigmaPage> {
  late Future<Map<String, dynamic>> _layout;
  Future<Map<String, dynamic>> _load() async =>
      jsonDecode(await rootBundle.loadString(
              '${KitCatalogue.assetRoot}/layouts/${widget.page.toLowerCase().replaceAll(' ', '-')}.json'))
          as Map<String, dynamic>;
  @override
  void initState() {
    super.initState();
    _layout = _load();
  }

  @override
  void didUpdateWidget(KitFigmaPage old) {
    super.didUpdateWidget(old);
    if (old.page != widget.page) _layout = _load();
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<Map<String, dynamic>>(
      future: _layout,
      builder: (context, snapshot) {
        if (snapshot.hasError)
          return const Center(child: Text('Could not load the design page.'));
        if (!snapshot.hasData)
          return const Center(child: CircularProgressIndicator());
        final layout = snapshot.data!,
            brightness = widget.brightness ?? Theme.of(context).brightness;
        return LayoutBuilder(builder: (context, constraints) {
          final scale =
              (constraints.maxWidth / _n(layout['width'])).clamp(0.01, 1.0);
          return InteractiveViewer(
            minScale: 1,
            maxScale: 8,
            child: SingleChildScrollView(
              child: SizedBox(
                width: _n(layout['width']) * scale,
                height: _n(layout['height']) * scale,
                child: FittedBox(
                  alignment: Alignment.topLeft,
                  child: SizedBox(
                    width: _n(layout['width']),
                    height: _n(layout['height']),
                    child: ColoredBox(
                      color: Color(int.parse(
                          (layout['background'] as String)
                              .replaceFirst('#', 'ff'),
                          radix: 16)),
                      child: Stack(clipBehavior: Clip.hardEdge, children: [
                        Positioned(
                          left: -_n(layout['x']),
                          top: -_n(layout['y']),
                          child: SizedBox(
                            width: _n(layout['width']),
                            height: _n(layout['height']),
                            child: Stack(clipBehavior: Clip.none, children: [
                              for (final node in layout['nodes'])
                                _placement(node, brightness)
                            ]),
                          ),
                        ),
                      ]),
                    ),
                  ),
                ),
              ),
            ),
          );
        });
      });

  Widget _placement(Map<String, dynamic> node, Brightness inherited) {
    final m = (node['transform'] as List).map(_n).toList();
    final brightness = node['appearance'] == 'light'
        ? Brightness.light
        : node['appearance'] == 'dark'
            ? Brightness.dark
            : inherited;
    Widget children = Stack(clipBehavior: Clip.none, children: [
      for (final child in node['children'] ?? []) _placement(child, brightness)
    ]);
    if (node['clip'] != null)
      children = ClipPath(clipper: _SourceClip(node['clip']), child: children);
    return Positioned(
        left: 0,
        top: 0,
        child: Transform(
            alignment: Alignment.topLeft,
            transform: Matrix4(m[0], m[1], 0, 0, m[2], m[3], 0, 0, 0, 0, 1, 0,
                m[4], m[5], 0, 1),
            child: Opacity(
                opacity: _n(node['opacity'] ?? 1),
                child: SizedBox(
                    width: _n(node['width']),
                    height: _n(node['height']),
                    child: Stack(clipBehavior: Clip.none, children: [
                      KitComponent(
                          id: node['componentId'],
                          entry: node['entry'] == null
                              ? null
                              : KitEntry.fromJson(node['entry']),
                          brightness: brightness,
                          label: node['name']),
                      Positioned.fill(child: children)
                    ])))));
  }
}

class _SourceClip extends CustomClipper<Path> {
  final String data;
  const _SourceClip(this.data);
  @override
  Path getClip(Size size) => parseSvgPathData(data);
  @override
  bool shouldReclip(_SourceClip oldClipper) => oldClipper.data != data;
}
