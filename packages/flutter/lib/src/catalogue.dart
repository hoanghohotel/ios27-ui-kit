import 'dart:convert';
import 'package:flutter/services.dart';

class KitEntry {
 final String id, page, group, name, file;
 final double width, height;
 final Map<String,String> properties;
 final List<String> warnings;
 const KitEntry({required this.id,required this.page,required this.group,required this.name,required this.file,required this.width,required this.height,required this.properties,required this.warnings});
 factory KitEntry.fromJson(Map<String,dynamic> j)=>KitEntry(id:j['id'],page:j['page'],group:j['group'],name:j['name'],file:j['file'],width:(j['width'] as num).toDouble(),height:(j['height'] as num).toDouble(),properties:Map<String,String>.from(j['properties']),warnings:List<String>.from(j['warnings']));
}
class KitCatalogue {
 static const assetRoot='packages/ios27_kit/assets';
 static Future<List<KitEntry>>? _entries;
 static Future<List<KitEntry>> load()=>_entries??=rootBundle.loadString('$assetRoot/catalogue.json').then((s)=>(jsonDecode(s) as List).map((j)=>KitEntry.fromJson(j)).toList(growable:false));
 static Future<KitEntry> find({String? id,String? group,String? page,Map<String,String> variant=const {}})async{
  final entries=await load();
  return entries.firstWhere((e)=>id!=null?e.id==id:e.group==group&&(page==null||e.page==page)&&variant.entries.every((v)=>e.properties[v.key]==v.value),orElse:()=>throw ArgumentError('Unknown variant: $id $page/$group $variant'));
 }
 static Future<List<dynamic>> tokens()async=>jsonDecode(await rootBundle.loadString('$assetRoot/tokens.json')) as List;
}
