const str = '玉米鸡翅煲/西兰花炒香菇/家常豆腐/油焖大虾/青椒火腿土豆片/蚝油生菜/双椒鸡丁/西芹炒木耳/青椒火腿炒蛋/鱼香肉丝/干锅土豆片/白灼菜心/宫保鸡丁/蒜蓉粉丝/玉子豆腐虾仁蒸蛋/荷塘小炒/白灼茼蒿/奥尔良烤翅/孜然土豆午餐肉/孜然鸡翅土豆条/木须鸡蛋/荷兰豆炒牛柳/西兰花炒鸡胸肉/菌菇炒火腿/茄汁豆腐抱蛋/芦笋炒虾仁/红烧排骨/菠萝咕肉/蒜苔炒肉丝/山药炒木耳珍珠糯米丸子/金钱蛋/红烧肉/四季豆炒肉丝/虾滑藕夹/红枣糯米/青椒炒杏鲍菇/茄汁金针菇/干煸四季豆/爆炒花甲/嫩滑水蒸蛋/干锅土豆片/凉拌土豆片/凉拌海带豆皮/凉拌菠菜金针菇/凉拌虾仁/凉拌紫甘蓝/凉拌莴笋丝/芙蓉鲜蔬汤/玉米冬瓜汤/丝瓜豆腐汤/番茄菌菇汤/番茄豆皮汤/上汤娃娃菜'

const arr = str.split('/').map(item => item.trim());

(async () => {
  for (const item of arr) {
    const res = await fetch(`https://it-news.aries-happy.com/cook/check-by-input?input=${item}`);
    const data = await res.json();
    console.log(item);
    console.log(data);
  }
})()