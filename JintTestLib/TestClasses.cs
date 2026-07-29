using System;

namespace JintTestLib;

// 委托类型
public delegate int MathOp(int a, int b);

// 扩展方法类
public static class MathExtensions
{
    // 扩展方法：int 翻倍
    public static int Double(this int x) => x * 2;

    // 扩展方法：字符串大写加感叹号
    public static string Shout(this string s) => s.ToUpper() + "!";

    // 扩展方法重载
    public static int Double(this int x, int times) => x * 2 * times;
}

public class Calculator
{
    // 委托属性
    public MathOp? Op { get; set; }

    // 委托参数方法
    public int Apply(MathOp op, int a, int b) => op(a, b);

    // 接收 Func 委托
    public int ApplyFunc(Func<int, int, int> op, int a, int b) => op(a, b);

    // 重载方法：int / string / object
    public string Format(int x) => $"int: {x}";
    public string Format(string s) => $"string: {s}";
    public string Format(object o) => $"object: {o}";

    // params 与固定参数重载
    public int Sum(params int[] args)
    {
        int total = 0;
        foreach (var v in args) total += v;
        return total;
    }
    public int Sum(int a, int b) => a + b;

    // 触发委托属性
    public int RunOp(int a, int b) => Op != null ? Op(a, b) : 0;
}
