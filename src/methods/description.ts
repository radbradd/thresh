export function Description(description: string) {
  return function(target: any, method: string) {
    target[method].description = description;
    return target;
  };
}
