using System;
using System.Diagnostics;
using Microsoft.AspNetCore.Http;

namespace ProductRiskValidation
{
    public sealed class CodeBlockExecutionTimer : IDisposable
    {
        private const string TimerName = nameof(CodeBlockExecutionTimer);
        public static IHttpContextAccessor HttpContextAccessor;

        private readonly string _action;
        private readonly Stopwatch _stopwatch;
        private bool? _enabled;
        private bool _disposed;

        public CodeBlockExecutionTimer(string action)
        {
            if (!Enabled) return;

            _action = action;
            _stopwatch = Stopwatch.StartNew();
        }

        private bool Enabled
        {
            get
            {
                if (!_enabled.HasValue)
                  _enabled = Environment.GetEnvironmentVariable("CODE_BLOCK_EXECUTION_TIMER_ENABLED") == "TRUE" && HttpContextAccessor != null;

                return _enabled.Value;
            }
        }

        private static string RequestId
        {
            get
            {
                var key = $"{TimerName}_Id";
                var items = HttpContextAccessor.HttpContext.Items;
                string value;

                if (items.ContainsKey(key))
                {
                    value = items[key] as string;
                }
                else 
                {
                    value = Guid.NewGuid().ToString("N");
                    items[key] = value;
                } 
                
                return value;
            }
        }

        public void Dispose()
        {
            if (!Enabled || _disposed) return;

            _disposed = true;
            _stopwatch.Stop();

            var now = DateTime.UtcNow.ToString("o");
            var request = HttpContextAccessor.HttpContext.Request;
            Console.WriteLine($"{now} [INFO]: LogType={TimerName}, action={_action}, requestId={RequestId}, correlationId={request.Headers["ctm-correlation-id"]}, path={request.Path}, ms={_stopwatch.ElapsedMilliseconds}, bodySize={request.Body.Length}");
        }
    }
}
