import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:ios27_kit/ios27_kit.dart';

void main() {
  testWidgets('native button invokes callback and disabled button does not', (tester) async {
    var count = 0;
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: Column(children: [
      KitButton(label: 'Save', onPressed: () => count++),
      const KitButton(label: 'Disabled'),
    ]))));
    await tester.tap(find.text('Save'));
    await tester.tap(find.text('Disabled'));
    expect(count, 1);
  });

  testWidgets('catalogue loads and source button renders with editable text', (tester) async {
    await tester.runAsync(() async {
      final entries = await KitCatalogue.load();
      expect(entries.length, 1511);
      expect((await KitCatalogue.find(id: '5:108579')).page, 'Buttons');
    });
    await tester.runAsync(() async {
      await tester.pumpWidget(const MaterialApp(home: Scaffold(body: KitComponent(
        id: '5:108579', texts: {'Label': 'Save'},
      ))));
      for (var attempt = 0; attempt < 50; attempt++) {
        await Future<void>.delayed(const Duration(milliseconds: 100));
        await tester.pump();
        if (find.byType(SvgPicture).evaluate().isNotEmpty) break;
      }
      await Future<void>.delayed(const Duration(milliseconds: 200));
      await tester.pump();
    });
    expect(find.byType(SvgPicture), findsOneWidget);
    expect(find.text('Save'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
