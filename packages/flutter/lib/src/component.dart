import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'catalogue.dart';

double _d(dynamic n)=>(n as num?)?.toDouble()??0;
Color _color(String hex)=>Color(int.parse(hex.replaceFirst('#','ff'),radix:16));
class KitComponent extends StatefulWidget {
 final String? id,group,page,label;
 final Map<String,String> variant,texts;
 final Map<String,VoidCallback> actions;
 final Brightness? brightness;
 final double? width;
 final double scale;
 final VoidCallback? onPressed;
 final KitEntry? entry;
 const KitComponent({super.key,this.id,this.group,this.page,this.label,this.variant=const {},this.texts=const {},this.actions=const {},this.brightness,this.width,this.scale=1,this.onPressed,this.entry});
 @override State<KitComponent> createState()=>_KitComponentState();
}
class _KitComponentState extends State<KitComponent> {
 late Future<Map<String,dynamic>> _future;
 static final _cache=<String,Future<Map<String,dynamic>>>{};
 static final _imageCache=<String,Future<String>>{};
 @override void initState(){super.initState();_future=_load();}
 @override void didUpdateWidget(KitComponent old){super.didUpdateWidget(old);if(old.id!=widget.id||old.entry?.id!=widget.entry?.id||old.group!=widget.group||old.page!=widget.page||jsonEncode(old.variant)!=jsonEncode(widget.variant))_future=_load();}
 Future<Map<String,dynamic>> _load()async {
  final entry=widget.entry??await KitCatalogue.find(id:widget.id,group:widget.group,page:widget.page,variant:widget.variant);
  return _cache.putIfAbsent(entry.id,()async{
   final j=jsonDecode(await rootBundle.loadString('${KitCatalogue.assetRoot}/components/${entry.file}')) as Map<String,dynamic>;
   final images=jsonDecode(await rootBundle.loadString('${KitCatalogue.assetRoot}/images.json')) as Map<String,dynamic>;
   for(final mode in ['light','dark']){
    final scene=j[mode] as Map<String,dynamic>;var svg=scene['svg'] as String;
    final refs=List<String>.from(scene['assets']);
    final values=await Future.wait(refs.map((hash)=>_imageCache.putIfAbsent(hash,()async{final info=images[hash];final bytes=await rootBundle.load('${KitCatalogue.assetRoot}/${info['file']}');return 'data:${info['mime']};base64,${base64Encode(bytes.buffer.asUint8List(bytes.offsetInBytes,bytes.lengthInBytes))}';})));
    for(var i=0;i<refs.length;i++){svg=svg.replaceAll('__ASSET_${refs[i]}__',values[i]);}
    // flutter_svg does not implement SVG filters; keep the source fills and geometry.
    svg=svg.replaceAll(RegExp(r'<filter\b[\s\S]*?</filter>'),'').replaceAll(RegExp(r' filter="[^"]*"'),'');
    // A white Multiply source only supplies filter alpha; it is not white paint.
    svg=svg.replaceAll(RegExp(r'<!--neutral-source:start-->[\s\S]*?<!--neutral-source:end-->'),'');
    scene['svg']=svg;
   }
   return j;
  });
 }
 @override Widget build(BuildContext context)=>FutureBuilder<Map<String,dynamic>>(future:_future,builder:(context,snapshot){
  if(snapshot.hasError)return Semantics(label:'Component failed to load',child:Text('${snapshot.error}',style:const TextStyle(color:Colors.red,fontSize:12)));
  if(!snapshot.hasData)return SizedBox(width:widget.width??40,height:28,child:const Center(child:SizedBox(width:16,height:16,child:CircularProgressIndicator(strokeWidth:2))));
  final j=snapshot.data!;final dark=(widget.brightness??Theme.of(context).brightness)==Brightness.dark;
  final scene=j[dark?'dark':'light'] as Map<String,dynamic>;var svg=scene['svg'] as String;
  final width=_d(j['width']),height=_d(j['height']);final factor=widget.width!=null?widget.width!/width:widget.scale;
  final overlays=<Widget>[];
  for(final raw in scene['texts'] as List){final t=raw as Map<String,dynamic>;final replacement=widget.texts[t['id']]??widget.texts[t['name']]??widget.texts[t['key']];if(replacement==null)continue;
   svg=svg.replaceAll(RegExp('<!--${t['key']}:start-->[\\s\\S]*?<!--${t['key']}:end-->'),'');
   final m=(t['matrix'] as List).map(_d).toList();
   overlays.add(Positioned(left:0,top:0,child:Transform(alignment:Alignment.topLeft,transform:Matrix4(m[0],m[1],0,0,m[2],m[3],0,0,0,0,1,0,m[4],m[5],0,1),child:SizedBox(width:_d(t['width']),height:_d(t['height']),child:Text(replacement,overflow:TextOverflow.clip,textAlign:t['align']=='CENTER'?TextAlign.center:t['align']=='RIGHT'?TextAlign.right:TextAlign.left,style:TextStyle(fontSize:_d(t['fontSize']),height:_d(t['lineHeight'])/_d(t['fontSize']),color:_color(t['color']).withValues(alpha:_d(t['opacity'])),fontWeight:FontWeight.values[((_d(t['fontWeight'])/100).round()-1).clamp(0,8)]))))));
  }
  for(final raw in scene['hits'] as List){final h=raw as Map<String,dynamic>;final action=widget.actions[h['id']]??widget.actions[h['name']];if(action==null)continue;overlays.add(Positioned(left:_d(h['x']),top:_d(h['y']),width:_d(h['width']),height:_d(h['height']),child:Semantics(button:true,label:h['name'],child:TextButton(onPressed:action,style:TextButton.styleFrom(padding:EdgeInsets.zero,minimumSize:Size.zero),child:const SizedBox.expand()))));}
  Widget content=SizedBox(width:width*factor,height:height*factor,child:FittedBox(fit:BoxFit.fill,child:SizedBox(width:width,height:height,child:Stack(clipBehavior:Clip.none,children:[SvgPicture.string(svg,width:width,height:height,excludeFromSemantics:true,allowDrawingOutsideViewBox:true,clipBehavior:Clip.none),...overlays]))));
  if(widget.onPressed!=null)content=Semantics(button:true,label:widget.label??j['group'],child:InkWell(onTap:widget.onPressed,child:content));else if(widget.actions.isEmpty)content=Semantics(label:widget.label??j['group'],child:content);
  return content;
 });
}
