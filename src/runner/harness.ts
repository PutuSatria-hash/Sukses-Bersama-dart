export const LATIH_HARNESS = `import 'dart:async';

abstract class Matcher {
  const Matcher();
  bool matches(Object? actual, Map<String, Object?> mismatch);
}

typedef _PredicateFn = bool Function(Object? actual);

String describe(Object? value) {
  if (value == null) return 'null';
  if (value is String) return "'\$value'";
  if (value is num || value is bool) return '<\$value>';
  return '\$value';
}

Matcher _wrap(Object? valueOrMatcher) =>
    valueOrMatcher is Matcher ? valueOrMatcher : equals(valueOrMatcher);

class _Equals extends Matcher {
  const _Equals(this.expected);
  final Object? expected;

  @override
  bool matches(Object? actual, Map<String, Object?> mismatch) {
    if (_deepEquals(actual, expected)) return true;
    mismatch['expected'] = expected;
    mismatch['actual'] = actual;
    return false;
  }

  @override
  String toString() => 'equals(\${describe(expected)})';
}

class _Predicate extends Matcher {
  const _Predicate(this.fn, this.description);
  final _PredicateFn fn;
  final String description;

  @override
  bool matches(Object? actual, Map<String, Object?> mismatch) {
    if (fn(actual)) return true;
    mismatch['expected'] = description;
    mismatch['actual'] = actual;
    return false;
  }

  @override
  String toString() => description;
}

class _Throws extends Matcher {
  const _Throws(this.inner);
  final Matcher? inner;

  @override
  bool matches(Object? actual, Map<String, Object?> mismatch) {
    if (actual is! Function) {
      mismatch['expected'] = 'fungsi yang melempar';
      mismatch['actual'] = actual;
      return false;
    }
    var threw = false;
    Object? thrown;
    try {
      final result = actual();
      if (result is Future) {
        mismatch['expected'] = 'fungsi sinkron yang melempar';
        mismatch['actual'] = 'Future (await expect(...()) dahulu)';
        return false;
      }
    } catch (e) {
      threw = true;
      thrown = e;
    }
    if (!threw) {
      mismatch['expected'] = 'fungsi yang melempar';
      mismatch['actual'] = 'tidak melempar apa-apa';
      return false;
    }
    if (inner == null) return true;
    return inner!.matches(thrown, mismatch);
  }

  @override
  String toString() => 'throwsA';
}

bool _deepEquals(Object? a, Object? b) {
  if (identical(a, b)) return true;
  if (a is List && b is List) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (!_deepEquals(a[i], b[i])) return false;
    }
    return true;
  }
  if (a is Map && b is Map) {
    if (a.length != b.length) return false;
    for (final key in a.keys) {
      if (!b.containsKey(key) || !_deepEquals(a[key], b[key])) return false;
    }
    return true;
  }
  if (a is Set && b is Set) {
    if (a.length != b.length) return false;
    final rest = b.toList();
    for (final item in a) {
      final i = rest.indexWhere((other) => _deepEquals(item, other));
      if (i < 0) return false;
      rest.removeAt(i);
    }
    return true;
  }
  return a == b;
}

Matcher equals(Object? expected) => _Equals(expected);

final Matcher isTrue = _Predicate((a) => a == true, 'true');
final Matcher isFalse = _Predicate((a) => a == false, 'false');
final Matcher isNull = _Predicate((a) => a == null, 'null');
final Matcher isNotNull = _Predicate((a) => a != null, 'bukan null');
final Matcher isEmpty = _Predicate(
  (a) =>
      a is Iterable && a.isEmpty ||
      a is Map && a.isEmpty ||
      a is String && a.isEmpty,
  'kosong',
);
final Matcher isNotEmpty = _Predicate(
  (a) =>
      a is Iterable && a.isNotEmpty ||
      a is Map && a.isNotEmpty ||
      a is String && a.isNotEmpty,
  'tidak kosong',
);

Matcher hasLength(Object? lengthOrMatcher) {
  final inner = _wrap(lengthOrMatcher);
  return _Predicate((a) {
    int? length;
    if (a is Iterable) {
      length = a.length;
    } else if (a is Map) {
      length = a.length;
    } else if (a is String) {
      length = a.length;
    }
    if (length == null) return false;
    return inner.matches(length, <String, Object?>{});
  }, 'panjang \$lengthOrMatcher');
}

Matcher contains(Object? expected) => _Predicate((a) {
  if (a is String && expected is String) return a.contains(expected);
  if (a is Iterable) return a.contains(expected);
  if (a is Map) return a.containsKey(expected) || a.containsValue(expected);
  return false;
}, 'memuat \${describe(expected)}');

Matcher containsAll(Iterable<Object?> expected) => _Predicate((a) {
  if (a is String) return expected.every((e) => e is String && a.contains(e));
  if (a is Iterable) return expected.every(a.contains);
  return false;
}, 'memuat semua \$expected');

Matcher orderedEquals(Iterable<Object?> expected) => _Predicate((a) {
  if (a is! Iterable) return false;
  return _deepEquals(a.toList(), expected.toList());
}, 'urut sama dengan \$expected');

Matcher unorderedEquals(Iterable<Object?> expected) => _Predicate((a) {
  if (a is! Iterable) return false;
  return _deepEquals(a.toSet(), expected.toSet());
}, 'isi sama dengan \$expected');

Matcher closeTo(num expected, num epsilon) => _Predicate(
  (a) => a is num && (a - expected).abs() <= epsilon,
  'mendekati \$expected (±\$epsilon)',
);

Matcher greaterThan(num value) =>
    _Predicate((a) => a is num && a > value, '> \$value');
Matcher greaterThanOrEqualTo(num value) =>
    _Predicate((a) => a is num && a >= value, '>= \$value');
Matcher lessThan(num value) =>
    _Predicate((a) => a is num && a < value, '< \$value');
Matcher lessThanOrEqualTo(num value) =>
    _Predicate((a) => a is num && a <= value, '<= \$value');

Matcher isA<T>() => _Predicate((a) => a is T, 'turunan \$T');

final Matcher throwsArgumentError = _Throws(isA<ArgumentError>());
final Matcher throwsStateError = _Throws(isA<StateError>());
final Matcher throwsFormatException = _Throws(isA<FormatException>());
final Matcher throwsRangeError = _Throws(isA<RangeError>());

Matcher throwsA(Object? expected) =>
    _Throws(expected == null ? null : _wrap(expected));

const Matcher returnsNormally = _ReturnsNormally();

class _ReturnsNormally extends Matcher {
  const _ReturnsNormally();

  @override
  bool matches(Object? actual, Map<String, Object?> mismatch) {
    if (actual is! Function) {
      mismatch['expected'] = 'fungsi yang selesai normal';
      mismatch['actual'] = actual;
      return false;
    }
    try {
      final result = actual();
      if (result is Future) {
        mismatch['expected'] = 'fungsi sinkron yang selesai normal';
        mismatch['actual'] = 'Future (await expect(...()) dahulu)';
        return false;
      }
    } catch (e) {
      mismatch['expected'] = 'fungsi yang selesai normal';
      mismatch['actual'] = 'melempar \$e';
      return false;
    }
    return true;
  }

  @override
  String toString() => 'returnsNormally';
}

final Matcher throws = _Throws(null);

Matcher allOf(Iterable<Object?> matchers) {
  final inners = matchers.map(_wrap).toList();
  return _Predicate(
    (a) => inners.every((m) => m.matches(a, <String, Object?>{})),
    'semua cocok',
  );
}

Matcher anyOf(Iterable<Object?> matchers) {
  final inners = matchers.map(_wrap).toList();
  return _Predicate(
    (a) => inners.any((m) => m.matches(a, <String, Object?>{})),
    'salah satu cocok',
  );
}

Matcher isNot(Object? matcherOrValue) {
  final inner = _wrap(matcherOrValue);
  return _Predicate(
    (a) => !inner.matches(a, <String, Object?>{}),
    'bukan \$matcherOrValue',
  );
}

class TestFailure implements Exception {
  TestFailure(this.message);
  final String message;

  @override
  String toString() => message;
}

FutureOr<void> expect(Object? actual, Object? matcher, {String? reason}) {
  if (actual is Future) {
    return actual.then((value) {
      if (value is Future) {
        throw TestFailure('Expected: nilai biasa  Actual: Future bersarang');
      }
      _checkExpect(value, matcher, reason);
    });
  }
  _checkExpect(actual, matcher, reason);
}

void _checkExpect(Object? value, Object? matcher, String? reason) {
  final inner = _wrap(matcher);
  final mismatch = <String, Object?>{};
  if (inner.matches(value, mismatch)) return;
  final expected = mismatch.containsKey('expected')
      ? mismatch['expected']
      : matcher;
  final seen = mismatch.containsKey('actual') ? mismatch['actual'] : value;
  final expectedText = expected is String ? expected : describe(expected);
  final actualText = seen is String ? "'\$seen'" : describe(seen);
  var message = 'Expected: \$expectedText  Actual: \$actualText';
  if (reason != null && reason.isNotEmpty) message += '\\n\$reason';
  throw TestFailure(message);
}

Never fail(String message) => throw TestFailure(message);

class Timeout {
  const Timeout(this.duration);
  final Duration? duration;

  static const none = Timeout(null);
}

typedef _TestBody = FutureOr<void> Function();

class _TestCase {
  _TestCase(this.name, this.body, this.timeout, this.skip);
  final String name;
  final _TestBody body;
  final Timeout? timeout;
  final Object? skip;
}

final List<_TestCase> _tests = [];
final List<String> _groupStack = [];
final List<_TestBody> _setUpStack = [];
final List<_TestBody> _tearDownStack = [];

void test(String name, _TestBody body, {Timeout? timeout, Object? skip}) {
  final full = [..._groupStack, name].join(' ');
  _tests.add(_TestCase(full, body, timeout, skip));
}

void group(String name, void Function() body) {
  _groupStack.add(name);
  try {
    body();
  } finally {
    _groupStack.removeLast();
  }
}

void setUp(_TestBody body) => _setUpStack.add(body);
void tearDown(_TestBody body) => _tearDownStack.add(body);

const _prefix = '@@LATIH@@';
const _defaultTimeout = Duration(seconds: 5);

String _escape(String value) {
  final buffer = StringBuffer('"');
  for (final unit in value.codeUnits) {
    switch (unit) {
      case 0x22:
        buffer.write(r'\\"');
      case 0x5C:
        buffer.write(r'\\\\');
      case 0x0A:
        buffer.write(r'\\n');
      case 0x0D:
        buffer.write(r'\\r');
      case 0x09:
        buffer.write(r'\\t');
      default:
        if (unit < 0x20) {
          buffer.write('\\\\u\${unit.toRadixString(16).padLeft(4, '0')}');
        } else {
          buffer.writeCharCode(unit);
        }
    }
  }
  buffer.write('"');
  return buffer.toString();
}

void _emit(String type, [Map<String, Object?> fields = const {}]) {
  final entries = <String>['"type":\${_escape(type)}'];
  for (final entry in fields.entries) {
    final value = entry.value;
    final rendered = value == null
        ? 'null'
        : value is num || value is bool
        ? '\$value'
        : _escape('\$value');
    entries.add('\${_escape(entry.key)}:\$rendered');
  }
  Zone.root.print('\$_prefix{\${entries.join(',')}}');
}

Future<void> runLatihTests() async {
  final total = _tests.length;
  _emit('start', {'total': total});
  var passed = 0;
  for (final testCase in _tests) {
    final ok = await _runOne(testCase);
    if (ok) passed++;
  }
  _emit('done', {'passed': passed, 'failed': total - passed});
}

Future<bool> _runOne(_TestCase testCase) async {
  final stopwatch = Stopwatch()..start();
  var status = 'pass';
  var message = '';
  var reason = '';

  Future<void> attempt() async {
    for (final hook in _setUpStack) {
      await hook();
    }
    try {
      await testCase.body();
    } finally {
      for (final hook in _tearDownStack.reversed) {
        await hook();
      }
    }
  }

  try {
    if (testCase.skip != null && testCase.skip != false) {
      status = 'pass';
      message = 'dilewati';
    } else {
      final limit = testCase.timeout?.duration ?? _defaultTimeout;
      final runner = Zone.current.fork(
        specification: ZoneSpecification(
          print: (self, parent, zone, line) => parent.print(zone, line),
        ),
      );
      if (testCase.timeout == Timeout.none) {
        await runner.run(attempt);
      } else {
        try {
          await runner.run(attempt).timeout(limit);
        } on TimeoutException {
          status = 'timeout';
          message = 'Test kedaluwarsa setelah \${limit.inMilliseconds} ms';
        }
      }
    }
  } on TestFailure catch (e) {
    status = 'fail';
    message = e.message;
    reason = _extractReason(e.message);
  } catch (e, stack) {
    status = 'error';
    message = '\$e\\n\$stack';
  }
  stopwatch.stop();

  _emit('result', {
    'name': testCase.name,
    'status': status,
    'message': message,
    'reason': reason,
    'durationMs': stopwatch.elapsedMilliseconds,
  });
  return status == 'pass';
}

String _extractReason(String message) {
  final index = message.indexOf('\\n');
  return index < 0 ? '' : message.substring(index + 1);
}
`;

