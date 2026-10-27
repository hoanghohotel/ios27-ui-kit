import 'package:flutter/material.dart';
import 'package:ios27_kit/ios27_kit.dart';

void main() => runApp(const KitDemo());

class KitDemo extends StatefulWidget {
  const KitDemo({super.key});
  @override
  State<KitDemo> createState() => _KitDemoState();
}

class _KitDemoState extends State<KitDemo> {
  bool dark = false, on = true;
  double volume = 60;
  int count = 1, visibleCount = 24;
  String segment = 'all', query = '';

  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: KitTheme.light(), darkTheme: KitTheme.dark(),
    themeMode: dark ? ThemeMode.dark : ThemeMode.light,
    home: Builder(builder: (context) => Scaffold(
      appBar: AppBar(title: const Text('iOS 27 · Component Library'), actions: [
        IconButton(tooltip: 'Toggle theme', onPressed: () => setState(() => dark = !dark), icon: Icon(dark ? Icons.light_mode : Icons.dark_mode)),
      ]),
      body: ListView(padding: const EdgeInsets.all(24), children: [
        const Text('Interactive controls', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w600)),
        const SizedBox(height: 24),
        Wrap(spacing: 16, runSpacing: 16, crossAxisAlignment: WrapCrossAlignment.center, children: [
          KitButton(label: 'Open alert', onPressed: () => showKitAlert(context, title: 'Ready to build', message: 'Reusable components for Flutter.')),
          KitButton(label: 'Secondary', appearance: KitButtonAppearance.tinted, onPressed: () {}),
          KitToggle(value: on, onChanged: (v) => setState(() => on = v), label: 'Notifications'),
          KitStepper(value: count, onChanged: (v) => setState(() => count = v)),
        ]),
        const SizedBox(height: 24),
        KitSegmentedControl(options: const {'all': 'All', 'saved': 'Saved', 'recent': 'Recent'}, value: segment, onChanged: (v) => setState(() => segment = v)),
        const SizedBox(height: 24),
        KitSlider(value: volume, label: 'Volume', onChanged: (v) => setState(() => volume = v)),
        const SizedBox(height: 24),
        const Text('Full design catalogue', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w600)),
        const SizedBox(height: 16),
        KitTextField(label: 'Find component', placeholder: 'Button, Alert, Tab Bar…', onChanged: (v) => setState(() { query = v; visibleCount = 24; })),
        const SizedBox(height: 20),
        FutureBuilder<List<KitEntry>>(
          future: KitCatalogue.load(),
          builder: (context, snapshot) {
            if (snapshot.hasError) return Text('${snapshot.error}');
            if (!snapshot.hasData) return const LinearProgressIndicator();
            final entries = snapshot.data!.where((e) => '${e.page} ${e.group} ${e.name}'.toLowerCase().contains(query.toLowerCase())).toList();
            return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${entries.length} variants'),
              const SizedBox(height: 16),
              ...entries.take(visibleCount).map((e) => Card(child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${e.page} / ${e.group}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text(e.name, style: const TextStyle(fontSize: 12)),
                  const SizedBox(height: 20),
                  LayoutBuilder(builder: (context, constraints) => SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: KitComponent(id: e.id, width: e.width > constraints.maxWidth ? constraints.maxWidth : null),
                  )),
                  const SizedBox(height: 12),
                  Text(e.id, style: const TextStyle(fontSize: 11)),
                ]),
              ))),
              if (visibleCount < entries.length) KitButton(label: 'Load more', appearance: KitButtonAppearance.tinted, onPressed: () => setState(() => visibleCount += 24)),
            ]);
          },
        ),
      ]),
    )),
  );
}
