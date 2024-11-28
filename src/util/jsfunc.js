export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular Reference]";
      }
      seen.add(value);
    }
    return value;
  };
};

// 사용 예시
// try {
//   console.log(JSON.stringify(renderedSlots, getCircularReplacer()));
// } catch (e) {
//   console.error("Stringification failed:", e);
// }

export function cleanReactStructure(obj, seen = new WeakMap()) {
  // null이거나 기본 타입이면 그대로 반환
  if (obj === null || typeof obj !== 'object') return obj;
  
  // 이미 처리한 객체라면 반환
  if (seen.has(obj)) return seen.get(obj);
  
  // 배열인 경우
  if (Array.isArray(obj)) {
    const cleanArray = obj.map(item => cleanReactStructure(item, seen));
    seen.set(obj, cleanArray);
    return cleanArray;
  }
  
  // 새로운 객체 생성
  const cleanObj = {};
  seen.set(obj, cleanObj);
  
  // 필요한 속성만 추출
  const keysToKeep = ['props', 'time', 'items', 'selectedItem', 'type', 'key', 'displayType', 'date'];
  
  for (const key of Object.keys(obj)) {
    // React 내부 속성 제외
    if (key.startsWith('__react')) continue;
    // _owner, stateNode 등 React Fiber 관련 속성 제외
    if (key === '_owner' || key === 'stateNode' || key === 'return') continue;
    
    // 필요한 속성만 포함
    if (keysToKeep.includes(key)) {
      if (key === 'time' && obj[key] instanceof Date) {
        cleanObj[key] = obj[key].toISOString();
      } else {
        cleanObj[key] = cleanReactStructure(obj[key], seen);
      }
    }
  }
  
  return cleanObj;
}

export const cleanReactStructure_2 = (obj, seen = new WeakMap()) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (seen.has(obj)) return seen.get(obj);

  if (Array.isArray(obj)) {
    const cleanArray = obj.map(item => cleanReactStructure(item, seen));
    seen.set(obj, cleanArray);
    return cleanArray;
  }

  const cleanObj = {};
  seen.set(obj, cleanObj);

  // React 컴포넌트의 주요 속성만 보존
  const keysToKeep = ['type', 'key', 'props', 'items', 'time', 'selectedItem'];
  
  for (const key of Object.keys(obj)) {
    if (keysToKeep.includes(key)) {
      if (key === 'time' && obj[key] instanceof Date) {
        cleanObj[key] = obj[key].toISOString();
      } else {
        cleanObj[key] = cleanReactStructure(obj[key], seen);
      }
    }
  }

  return cleanObj;
};

// 사용 예시
// try {
//   const cleanData = cleanReactStructure(yourObject);
//   console.log(JSON.stringify(cleanData, null, 2));
// } catch (e) {
//   console.error('Error:', e);
// }