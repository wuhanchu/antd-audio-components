/**
 * num convert to chinese
 * @param {String} str in string
 */
export function numToChinese(str) {
    const convertMap = [
        "零",
        "一",
        "二",
        "三",
        "四",
        "五",
        "六",
        "七",
        "八",
        "九"
    ]

    let result = ""
    for (let char of str) {
        result += convertMap[char] || char
    }

    return result
}
