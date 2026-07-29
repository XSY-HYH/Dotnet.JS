using Dotnet.JS.Host;

VtSupport.TryEnable();

var host = new JintHost();
return host.Run(args);
